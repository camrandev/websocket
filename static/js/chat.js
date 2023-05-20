"use strict";

/** Client-side of groupchat. */

const urlParts = document.URL.split("/");
const roomName = urlParts[urlParts.length - 1];
const ws = new WebSocket(`ws://localhost:3000/chat/${roomName}`);

const name = prompt("Username? (no spaces)");

/** called when connection opens, sends join info to server. */

ws.onopen = function (evt) {
  console.log("open", evt);

  let data = { type: "join", name: name };
  ws.send(JSON.stringify(data));
};

/** called when msg received from server; displays it. */

ws.onmessage = function (evt) {
  console.log("message", evt);

  let msg = JSON.parse(evt.data);
  let item;
  console.log(msg);

  if (msg.type === "note") {
    item = $(`<li><i>${msg.text}</i></li>`);
  } else if (msg.type === "chat") {
    item = $(`<li><b>${msg.name}: </b>${msg.text}</li>`);
  } else {
    return console.error(`bad message: ${msg}`);
  }

  $("#messages").append(item);
};

/** called on error; logs it. */

ws.onerror = function (evt) {
  console.error(`err ${evt}`);
};

/** called on connection-closed; logs it. */

ws.onclose = function (evt) {
  console.log("close", evt);
};

/** send message when button pushed. */

$("form").submit(function (evt) {
  evt.preventDefault();

  if ($("#m").val() === "/joke") {
    let data = { type: "get-joke" };
    ws.send(JSON.stringify(data));

  } else if ($("#m").val() === "/members") {
    let data = { type: "get-members" };
    ws.send(JSON.stringify(data));

  } else if ($("#m").val().startsWith("/priv")) {
    console.log("Entered /priv check")
    const terms = $("#m").val().split(" ");
    terms.splice(0, 1);
    let data = {
      type: "private",
      username: terms.splice(0, 1)[0],
      text: terms.join(" ")
    };
    console.log("data", data)
    ws.send(JSON.stringify(data));

  } else {
    let data = { type: "chat", text: $("#m").val() };
    ws.send(JSON.stringify(data));
  }

  $("#m").val("");
});
