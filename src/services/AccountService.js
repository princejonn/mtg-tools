import isString from "lodash/isString";
import UUIDv4 from "uuid/v4";
import AES from "crypto-js/aes";
import encUTF8 from "crypto-js/enc-utf8";
import NeDB, { Collection } from "utils/NeDB";
import TimerMessage from "utils/TimerMessage";
import TappedOutAccount from "models/TappedOutAccount";
import InquiryService from "services/InquiryService";

class AccountService {
  constructor() {
    this._db = new NeDB(Collection.ACCOUNTS);
    this._name = "user";
    this._secret = "secret";
    this._cache = {};
    this._loaded = false;
  }

  /**
   * @returns {Promise<void>}
   */
  async login() {
    const { username, password } = await InquiryService.loginForm();

    if (!isString(username)) {
      throw new Error("username undefined");
    }
    if (!isString(password)) {
      throw new Error("password undefined");
    }

    await this.save(username, password);
    const account = await this.get();

    if (!account) {
      throw new Error("account service could not properly save your account");
    }
  }

  /**
   * @returns {Promise<TappedOutAccount>}
   */
  async get() {
    await this.load();

    const username = await this._decrypt(this._cache.username);
    const password = await this._decrypt(this._cache.password);

    if (!isString(username) || !isString(password)) {
      return null;
    }

    return new TappedOutAccount(username, password);
  }

  /**
   * @param {string} username
   * @param {string} password
   * @returns {Promise<void>}
   */
  async save(username, password) {
    const name = this._name;
    const encryptedUsername = await this._encrypt(username);
    const encryptedPassword = await this._encrypt(password);
    const data = {
      username: encryptedUsername,
      password: encryptedPassword,
    };

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

    const timerMessage = new TimerMessage("loading account from db");

    const exists = await this._db.find({ name: this._name });

    if (!exists) {
      throw new Error("found no account in db");
    }

    this._cache = exists;
    this._loaded = true;

    timerMessage.done();
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

const accountService = new AccountService();

export default accountService;
