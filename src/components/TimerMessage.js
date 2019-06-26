import { differenceInMilliseconds } from "date-fns";

export default class TimerMessage {
  constructor(message) {
    this.message = message;
    this.start = new Date();
    console.log(`${this.message} [ started ]`);
  }

  done() {
    this.end = new Date();
    console.log(`${this.message} [ finished ] (${differenceInMilliseconds(this.end, this.start)}ms)`);
  }
}
