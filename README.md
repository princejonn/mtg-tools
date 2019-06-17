# MTG Tools

## Setup

copy `example.env` into `.env` and add your login details.

run command `npm install`

ron command `npm run build`

**Why Login?**

The tool cannot find decks or search if you aren't logged in.

If you are worried over your details getting stolen - **Good**! You should always be worried over this. Check the `/src` code. You can search for `TAPPEDOUT_`. You can confirm that they are only ever used in the `TappedOut.login()` method.

## Improve current deck

`npm run improve {tappedOutLink}`
