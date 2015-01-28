import ZoneGroupMember from './ZoneGroupMember'; 

import React from 'react/addons';
import { Cursor, ImmutableOptimizations }  from 'react-cursor';
import EventableMixin from '../mixins/EventableMixin';

// import model from '../model';

class ZoneGroup {

	render () {
		var members = this.props.group.refine('ZoneGroupMember');

		var zoneNodes = members.value.map(function (item, index) {
			var z = members.refine(index);
			return (
				<ZoneGroupMember member={z} />
			);
		});

		var classString = 'not-selected'

		console.log(this.props.currentZone);
		if(this.props.currentZone.value && this.props.currentZone.value.$.ID === this.props.group.value.$.ID) {
			classString = 'selected';
		}

		return (
			<ul className={classString} onClick={this._onClick}>
				{{zoneNodes}}
			</ul>
		);
	}

	_onClick () {
		this.trigger('zonegroup:select', this.props.group.value);
	}
}

ZoneGroup.prototype.displayName = "ZoneGroup";
ZoneGroup.prototype.mixins = [
	ImmutableOptimizations(['cursor']),
	EventableMixin
];
ZoneGroup.prototype.propTypes = {
	group: React.PropTypes.instanceOf(Cursor).isRequired,
	currentZone: React.PropTypes.instanceOf(Cursor).isRequired
};
export default React.createClass(ZoneGroup.prototype);