"use strict";

let Constants = {
	SEARCH: '',

	VOLUME_CONTROLS_MUTE_SET: '',
	VOLUME_CONTROLS_VOLUME_SET: '',
	VOLUME_CONTROLS_START_ADJUST: '',
	VOLUME_CONTROLS_STOP_ADJUST: '',

	BROWSER_SELECT_ITEM: '',
	BROWSER_SCROLL_RESULT: '',
	BROWSER_BACK: '',
	BROWSER_HOME: '',
	BROWSER_PLAY: '',
	BROWSER_CHANGE_SEARCH_MODE: '',
	BROWSER_ADD_MUSICSERVICE: '',

	PLAYER_PAUSE: '',
	PLAYER_PLAY: '',
	PLAYER_PREV: '',
	PLAYER_NEXT: '',
	PLAYER_SEEK: '',

	QUEUE_GOTO: '',
	QUEUE_FLUSH: '',
	QUEUE_REMOVE: '',
	QUEUE_SELECT: '',
	QUEUE_DESELECT: '',
	QUEUE_REORDER: '',

	ZONE_GROUP_SELECT: '',
	ZONE_GROUP_SET: '',
	ZONE_GROUP_MANAGEMENT_SHOW: '',
	ZONE_GROUP_MANAGEMENT_HIDE: '',

	GROUP_MANAGEMENT_HIDE: '',
	GROUP_MANAGEMENT_SHOW: '',
	GROUP_MANAGEMENT_SELECT: '',
	GROUP_MANAGEMENT_DESELECT: '',
	GROUP_MANAGEMENT_CHANGED: '',

	SONOS_SERVICE_TOPOLOGY_EVENT: '',
	SONOS_SERVICE_TOPOLOGY_UPDATE: '',
	SONOS_SERVICE_ZONES_UPDATE: '',
	SONOS_SERVICE_ZONEGROUPS_DEFAULT: '',
	SONOS_SERVICE_QUEUE_UPDATE: '',
	SONOS_SERVICE_VOLUME_UPDATE: '',
	SONOS_SERVICE_PLAYSTATE_UPDATE: '',
	SONOS_SERVICE_CURRENT_TRACK_UPDATE: '',
	SONOS_SERVICE_NEXT_TRACK_UPDATE: '',
	SONOS_SERVICE_POSITION_INFO_UPDATE: '',
	SONOS_SERVICE_MUTED_UPDATE: '',
	SONOS_SERVICE_ZONEGROUP_TRACK_UPDATE: '',
	SONOS_SERVICE_MUSICSERVICES_UPDATE: '',
	SONOS_SERVICE_CURRENT_PLAY_MODE_UPDATE: '',
	SONOS_SERVICE_CURRENT_CROSSFADE_MODE_UPDATE: '',

	MUSICSERVICE_ADD_CANCEL: '',
	MUSICSERVICE_ADD_LINK_RECEIVED: '',
	MUSICSERVICE_AUTH_TOKEN_RECEIVED: '',

	OPTIMISTIC_CURRENT_PLAY_MODE_UPDATE: '',
	OPTIMISTIC_CURRENT_CROSSFADE_MODE_UPDATE: '',
};

Object.keys(Constants).forEach((k) => {
	Constants[k] = Symbol(k);
});

export default Constants;
