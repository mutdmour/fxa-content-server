/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redirects to settings if `account` is signed in,
 * returns `defaultBehavior` otherwise.
 */

define(function (require, exports, module) {
  'use strict';

  const NavigateBehavior = require('../behaviors/navigate');

  const t = (msg) => msg;
  let success = t('Account verified successfully');
  let endpoint = 'settings';

  module.exports = function (defaultBehavior, options = {}) {
    const behavior = function (view, account) {
      return account.isSignedIn()
        .then((isSignedIn) => {
          if (isSignedIn) {
            if (options.success) {
              success = options.success;
            }
            if (options.endpoint) {
              endpoint = options.endpoint;
            }
            return new NavigateBehavior(endpoint, {success});
          }

          return defaultBehavior;
        });
    };

    behavior.type = 'settings';

    return behavior;
  };
});
