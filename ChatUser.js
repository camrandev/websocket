"use strict";

/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require("./Room");
const axios = require("axios");

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** Make chat user: store connection-device, room.
   *
   * @param send {function} callback to send message to this user
   * @param room {Room} room user will be in
   * */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** Send msgs to this client using underlying connection-send-function.
   *
   * @param data {string} message to send
   * */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** Handle joining: add to room members, announce join.
   *
   * @param name {string} name to use in room
   * */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} joined "${this.room.name}".`,
    });
  }

  /** Handle a chat: broadcast to room.
   *
   * @param text {string} message to send
   * */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: "chat",
      text: text,
    });
  }

  /** Handle a joke request: broadcast to user.*/

  async handleJoke() {
    const result = await axios.get('https://icanhazdadjoke.com/',{ headers:{
      'Accept': 'text/plain'}
    })
    const joke = result.data;
    this.send(JSON.stringify({
      name: "Server",
      type: "chat",
      text: joke,
    }));
  }

  /** Handle a private message: send to user with 'username'
   *
   * @param {string} text
   * @param {string} username
   */

  handlePrivateMessage(text, username){
    console.log(text, username)
    try{
      user = this.room.getUser(username);

      user.send({
        name: this.name,
        type: "chat",
        text: text,
      });
      this.send({
        name: this.name,
        type: "chat",
        text: text,
      });

    }catch(err){
      text = err.message

      this.send({
        name: "Server",
        type: "chat",
        text: text,
      });
    }
  }

  /** Handle messages from client:
   *
   * @param jsonData {string} raw message data
   *
   * @example<code>
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   * </code>
   */

  async handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);

    if (msg.type === "join") this.handleJoin(msg.name);
    else if (msg.type === "chat") this.handleChat(msg.text);
    else if (msg.type === "get-joke") await this.handleJoke();
    else if (msg.type === "get-members") this.getMembers();
    else if (msg.type === "private") this.handlePrivateMessage(msg.text, msg.username);
    else throw new Error(`bad message: ${msg.type}`);
  }

  /**function to get all of the members in the current users room */
  getMembers() {
    const members = Array.from(this.room.members).map(user=>user.name);
    //console.log("MEMBERS", members)

    this.send(JSON.stringify({
      name: "Server",
      type: "chat",
      text: `in room: ${members.join(', ')}`,
    }));
  }

  /** Connection was closed: leave room, announce exit to others. */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} left ${this.room.name}.`,
    });
  }
}

module.exports = ChatUser;
