import e from './events';
import Search from './sonos/Search';
import Listener from './events/listener';

import xml2json from 'jquery-xml2json';

const reg = /^http:\/\/([\d\.]+)/;

var firstSonos;

var deviceSearches = {};
var listeners = {};
var serviceEventHandlers = {};

var currentSonos = null;
var currentSubscriptions = [];

var cursor;

class SonosCoordinator {

  constructor () {
    e.on('application:mount', this.handleAppMount.bind(this));
    e.on('zonegroup:select', this.selectCurrentZone.bind(this));
    e.on('playstate:toggle', this.toggelPlaystate.bind(this));
    e.on('playstate:prev', this.playPrev.bind(this));
    e.on('playstate:next', this.playNext.bind(this));
    e.on('queuelist:goto', this.queuelistGoto.bind(this));
    e.on('browser:action', this.browserAction.bind(this));
    e.on('volume:togglemute', this.toggleMute.bind(this));
    e.on('volume:set', this.volumeSet.bind(this));
  }


  handleAppMount (app, c) {
    cursor = c;
    this.cursor = c;
    this.searchForDevices();
  }


  queryState (sonos) {
    sonos.getVolume((err, vol) => {
      cursor.refine('volumeControls', 'master', 'volume').set(vol);
    });

    sonos.getGroupMuted((err, muted) => {
      cursor.refine('volumeControls', 'master', 'mute').set(muted);
    });

    sonos.currentTrack((err, track) => {
      cursor.merge({
        currentTrack: track
      });
    });

    sonos.getCurrentState((err, state) => {
      this.setCurrentState(state);
    });

    sonos.getMusicLibrary('queue', {}, (err, result) => {
      cursor.refine('queue').set(result);
    });
  }


  subscribeServiceEvents (sonos) {
    var x = listeners[sonos.host];

    let cb = (error, sid) => {
      if (error) throw err;
      currentSubscriptions.push(sid);
    }

    x.addService('/ZoneGroupTopology/Event', cb);
    x.addService('/MediaRenderer/AVTransport/Event', cb);
    x.addService('/MediaRenderer/RenderingControl/Event', cb);
    x.addService('/MediaRenderer/GroupRenderingControl/Event', cb);
    x.addService('/MediaServer/ContentDirectory/Event', cb);
  }


  unsubscribeServiceEvents (sonos) {
    var x = listeners[sonos.host];

    currentSubscriptions.forEach((sid) => {
      x.removeService(sid, (error) => {
        if (error) throw err;
        console.log('Successfully unsubscribed');
      });
    });

    currentSubscriptions = [];
  }


  setCurrentState(state) {
    cursor.merge({
      currentState: state
    });

    if(state === 'transitioning') {
      this.delayedQueryState(currentSonos);
      return;
    }

    cursor.refine('playState', 'playing').set(state === 'playing');
  }


  selectCurrentZone (value) {
    var sonos;

    cursor.merge({
      currentZone: value,
      currentTrack: {},
      playState: {
        playing: false
      },
      queue: {
        returned: 0,
        total: 0,
        items: []
      }
    });

    value.ZoneGroupMember.forEach((m) => {
      if(m.$.UUID === value.$.Coordinator) {
        let l = m.$.Location;
        let matches = reg.exec(l);
        sonos = deviceSearches[matches[1]];
      }
    });


    if(sonos) {

      if(currentSonos) {
        this.unsubscribeServiceEvents(currentSonos);
      }

      currentSonos = sonos;

      cursor.merge({
        coordinator: { host: sonos.host, port: sonos.port }
      });

      this.subscribeServiceEvents(sonos);
      this.queryState(sonos);
    }
  }


  playPrev () {
    currentSonos.previous(target, () => {
      this.queryState(currentSonos);
    });
  }

  playNext () {
    currentSonos.next(target, () => {
      this.queryState(currentSonos);
    });
  }

  queuelistGoto (target) {
    currentSonos.goto(target, () => {
      currentSonos.play(() => {
        this.queryState(currentSonos);
      });
    });
  }

  toggleMute (id) {
    let muted = this.cursor.refine('volumeControls', 'master', 'mute').value;

    currentSonos.setGroupMuted(!muted, () => {
      this.queryState(currentSonos);
    });
  }

  toggelPlaystate () {
    let isPlaying = this.cursor.refine('playState', 'playing').value;

    let cb = () => {
      this.queryState(currentSonos);
    };

    if(isPlaying) {
      currentSonos.pause(cb);
    } else {
      currentSonos.play(cb);
    }
  }

  volumeSet (params) {
    console.log('volumeSet', params.volume);

    port.postMessage({
      type: 'volumeSet',
      volume: params.volume,
      channel: params.channel,
      host: this.cursor.refine('coordinator', 'host').value
    });
  }


  browserAction (item) {
    var librarySearch = {
      headline: 'Browse Music Library',
      source: 'library',
      items: [
        {
          title: 'Artists',
          searchType: 'artists'
        },
        {
          title: 'Albums',
          searchType: 'albums'
        },
        {
          title: 'Composers',
          searchType: 'composers'
        },
        {
          title: 'Genres',
          searchType: 'genres'
        },
        {
          title: 'Tracks',
          searchType: 'tracks'
        },
        {
          title: 'Playlists',
          searchType: 'playlists'
        }
      ]
    };

    var model = this.cursor.refine('browserState');
    var source = model.refine('source').value;

    if(!source && item.source === 'library') {

      model.set(librarySearch);

    } else if(source === 'library' && item.searchType) {

      this.prendinBrowserUpdate = {
        headline : item.title,
        searchType : item.searchType
      };

      currentSonos.getMusicLibrary(item.searchType, {}, (err, result) => {
        	var state = this.prendinBrowserUpdate;
        	state.items = result.items;

        	this.cursor.refine('browserState').set(state);
        	this.prendinBrowserUpdate = null;
      });
    }
  }

  delayedQueryState (sonos) {
    window.setTimeout(() => {
      this.queryState.bind(sonos);
    }, 300);
  }


  searchForDevices() {

    var search = new Search((sonos) => {

      deviceSearches[sonos.host] = sonos;
      listeners[sonos.host] = new Listener(sonos);

      listeners[sonos.host].listen((err) => {
        if (err) throw err;

        listeners[sonos.host].onServiceEvent((endpoint, sid, data) => {

          console.log(endpoint, sid, data);

          if(endpoint === '/ZoneGroupTopology/Event') {
            var state = xml2json(data.ZoneGroupState, {
              explicitArray: true
            });

            cursor.merge({
          		zoneGroups: state.ZoneGroups.ZoneGroup
          	});

            	if(!cursor.refine('currentZone').value) {
            		this.selectCurrentZone(state.ZoneGroups.ZoneGroup[0]);
                this.delayedQueryState(currentSonos);
            	}
          }


          if(endpoint === '/MediaRenderer/AVTransport/Event') {
            var lastChange = xml2json(data.LastChange);

            var currentTrackDIDL = xml2json(lastChange.Event.InstanceID.CurrentTrackMetaData.$.val, {
              explicitArray: true
            });

            var nextTrackDIDL = xml2json(lastChange.Event.InstanceID['r:NextTrackMetaData'].$.val, {
              explicitArray: true
            });

            cursor.merge({
              currentTrack: sonos.parseDIDL(currentTrackDIDL),
              nextTrack: sonos.parseDIDL(nextTrackDIDL)
            });

            this.setCurrentState(sonos.translateState(lastChange.Event.InstanceID.TransportState.$.val));
          }
        });


        if(!currentSonos) {
          currentSonos = sonos;
          this.subscribeServiceEvents(currentSonos);
        }
      });
    });
  }

}

var sonosCoordinator = new SonosCoordinator();

export default sonosCoordinator;