/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define(function (require, exports, module) {
  'use strict';

  const { assert } = require('chai');
  const Constants = require('lib/constants');
  const FxFennecV1AuthenticationBroker = require('models/auth_brokers/fx-fennec-v1');
  const NullChannel = require('lib/channels/null');
  const Relier = require('models/reliers/relier');
  const sinon = require('sinon');
  const User = require('models/user');
  const WindowMock = require('../../../mocks/window');

  describe('models/auth_brokers/fx-fennec-v1', function () {
    let account;
    let broker;
    let channel;
    let metrics;
    let relier;
    let user;
    let windowMock;

    beforeEach(function () {
      channel = new NullChannel();
      metrics = {
        setViewNamePrefix: sinon.spy()
      };
      relier = new Relier();
      windowMock = new WindowMock();

      user = new User();
      account = user.initAccount({
        email: 'testuser@testuser.com',
        keyFetchToken: 'key-fetch-token',
        uid: 'uid',
        unwrapBKey: 'unwrap-b-key'
      });

      broker = new FxFennecV1AuthenticationBroker({
        channel: channel,
        metrics,
        relier: relier,
        window: windowMock
      });
      sinon.stub(broker, '_hasRequiredLoginFields').callsFake(() => true);

      sinon.spy(broker, 'send');
    });

    it('has the expected capabilities', () => {
      assert.isTrue(broker.hasCapability('signup'));
      assert.isTrue(broker.hasCapability('handleSignedInNotification'));
      assert.isTrue(broker.hasCapability('chooseWhatToSyncWebV1'));
      assert.isFalse(broker.hasCapability('emailVerificationMarketingSnippet'));
      assert.equal(broker.defaultCapabilities.chooseWhatToSyncWebV1.engines, Constants.DEFAULT_DECLINED_ENGINES);
    });

    it('disables the `chooseWhatToSyncCheckbox` capability', function () {
      return broker.fetch()
        .then(function () {
          assert.isFalse(broker.hasCapability('chooseWhatToSyncCheckbox'));
        });
    });

    describe('afterForceAuth', function () {
      it('notifies the channel of `login`', function () {
        return broker.afterForceAuth(account)
          .then(function (behavior) {
            assert.isTrue(broker.send.calledWith('fxaccounts:login'));
          });
      });
    });

    describe('afterSignIn', function () {
      it('notifies the channel of `login`, redirects to `/signin_confirmed`', function () {
        return broker.afterSignIn(account)
          .then(function (behavior) {
            assert.isTrue(broker.send.calledWith('fxaccounts:login'));
            assert.equal(behavior.type, 'connect-another-device');
          });
      });
    });

    describe('beforeSignUpConfirmationPoll', function () {
      it('notifies the channel of `login`, does not halt the flow', function () {
        return broker.beforeSignUpConfirmationPoll(account)
          .then(function (behavior) {
            assert.isTrue(broker.send.calledWith('fxaccounts:login'));
            assert.isUndefined(behavior.halt);
          });
      });
    });

    describe('afterSignUpConfirmationPoll', function () {
      it('redirects to `/connect_another_device`', function () {
        return broker.afterSignUpConfirmationPoll(account)
          .then(function (behavior) {
            assert.isTrue(metrics.setViewNamePrefix.calledOnce);
            assert.isTrue(metrics.setViewNamePrefix.calledWith('signup'));
            assert.equal(behavior.type, 'connect-another-device');
          });
      });
    });

    describe('afterSignInConfirmationPoll', function () {
      it('redirects to `/connect_another_device`', function () {
        return broker.afterSignInConfirmationPoll(account)
          .then(function (behavior) {
            assert.isTrue(metrics.setViewNamePrefix.calledOnce);
            assert.isTrue(metrics.setViewNamePrefix.calledWith('signin'));
            assert.equal(behavior.type, 'connect-another-device');
          });
      });
    });
  });
});


