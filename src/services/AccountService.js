import isString from "lodash/isString";
import UUIDv4 from "uuid/v4";
import AES from "crypto-js/aes";
import encUTF8 from "crypto-js/enc-utf8";
import NeDB, { Collection } from "utils/NeDB";
import TappedOutAccount from "models/TappedOutAccount";
import Logger from "utils/Logger";

class AccountService {
  constructor() {
    this._logger = Logger.getContextLogger("account-service");
    this._db = new NeDB(Collection.ACCOUNTS);
    this._name = "user";
    this._secret = "secret";
    this._cache = {};
    this._loaded = false;
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<TappedOutAccount>}
   */
  async build(username, password) {
    this._logger.debug("building username", username);
    return new TappedOutAccount(username, password);
  }

  /**
   * @returns {Promise<TappedOutAccount>}
   */
  async get() {
    await this.load();

    if (!this._cache || !this._cache.username) {
      return null;
    }

    const username = await this._decrypt(this._cache.username);
    const password = await this._decrypt(this._cache.password);

    this._logger.debug("getting username", username);

    if (!isString(username) || !isString(password)) {
      return null;
    }

    return this.build(username, password);
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  async save(username, password) {
    this._logger.debug("saving username", username);

    const name = this._name;
    const encryptedUsername = await this._encrypt(username);
    const encryptedPassword = await this._encrypt(password);
    const data = {
      username: encryptedUsername,
      password: encryptedPassword,
    };

    this._logger.debug("saving data", data);

    const exists = await this._db.find({ name });

    if (exists) {
      await this._db.update({ name }, data);
    } else {
      await this._db.insert({ name, ...data });
    }

    this._cache = data;
    this._loaded = true;
  }

  /**
   * @returns {Promise<void>}
   */
  async load() {
    if (this._loaded) return;

    const exists = await this._db.find({ name: this._name });

    if (!exists) return;

    this._cache = exists;
    this._loaded = true;
  }

  /**
   * @param {string} input
   * @returns {Promise<string>}
   * @private
   */
  async _encrypt(input) {
    const secret = await this._getSecret();
    return AES.encrypt(input, secret).toString();
  }

  /**
   * @param {string} encrypted
   * @returns {Promise<string>}
   * @private
   */
  async _decrypt(encrypted) {
    const secret = await this._getSecret();
    const bytes = AES.decrypt(encrypted.toString(), secret);
    return bytes.toString(encUTF8);
  }

  /**
   * @returns {Promise<*>}
   * @private
   */
  async _getSecret() {
    const exists = await this._db.find({ name: this._secret });

    if (exists) {
      return exists.secret;
    }

    const secret = UUIDv4();
    await this._setSecret(secret);

    return secret;
  }

  /**
   * @param {string} secret
   * @returns {Promise<void>}
   * @private
   */
  async _setSecret(secret) {
    const name = this._secret;
    const exists = await this._db.find({ name });

    if (exists) {
      await this._db.update({ name }, { secret });
    } else {
      await this._db.insert({ name, secret });
    }
  }
}

const service = new AccountService();

export default service;
