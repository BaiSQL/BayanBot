// Shared state and the $ helper.

let apiKey = "";
let history = [];
let chats = [], current = null, busy = false;
let modelIdx = 0;

let view = 'chat';

let images = [];

const $ = id => document.getElementById(id);
