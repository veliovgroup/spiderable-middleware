import { Meteor } from 'meteor/meteor';
import Spiderable from 'spiderable-middleware';

if (!Meteor.isServer) {
  throw new Meteor.Error(500, 'Running `ostrio:spiderable-middleware` on a Client isn\'t allowed! Please make sure `ostrio:spiderable-middleware` is imported and used only on server.');
}

export default Spiderable;
