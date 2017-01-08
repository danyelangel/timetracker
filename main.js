/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    "use strict";

    var VERSION = '0.1.1';

    var MainViewManager    = brackets.getModule("view/MainViewManager"),
        DocumentManager    = brackets.getModule("document/DocumentManager"),
        ProjectManager     = brackets.getModule("project/ProjectManager"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        CommandManager     = brackets.getModule("command/CommandManager"),
        Menus              = brackets.getModule("command/Menus");

    var lastAction         = 0,
        lastFile           = undefined,
        lastPause          = Date.now(),
        pausePeriod        = 60 * 60 * 1000,
        pauseLength        = 05 * 60 * 1000,
        idleTime           = 15 * 60 * 1000;
  
    require('https://www.gstatic.com/firebasejs/3.6.3/firebase.js');
  
    var config = {
      apiKey: "AIzaSyDEc5ANSFNlg2iNyYW7nfwhwMTaEEhepoM",
      authDomain: "timetracker-ecd54.firebaseapp.com",
      databaseURL: "https://timetracker-ecd54.firebaseio.com",
      storageBucket: "timetracker-ecd54.appspot.com",
      messagingSenderId: "92200809868"
    };
  
    console.log(config);
  
    firebase.initializeApp(config);

    function init() { 

        setupEventListeners();

        console.log('Timetracker initialized');
      
    }

    function setupEventListeners() {
        MainViewManager.on('currentFileChange', function () {
            handleAction();
        });
        DocumentManager.on('documentSaved', function () {
            handleAction(true);
        });
        $(window).on('keypress', function () {
            handleAction();
        });
    }
  
    function checkActivePause() {
      if (isIdle()) {
        lastPause = Date.now();
      } else if (lastPause + pausePeriod < Date.now()) {
        makePause(function () {
          lastPause = Date.now();
        });
      }
    }
  
    function makePause(callback) {
      if (confirm('-- MAKE AN ACTIVE PAUSE --')) {
        setTimeout(function () {
          alert('-- PAUSE DONE --');
          callback();
        }, pauseLength);
      }
    }

    function sendHeartbeat(file, timestamp, project, language, isWrite, lines) {
        var date = new Date(timestamp);
        firebase.database().ref('brackets_logs').push({
            timestamp: timestamp,
            date: date.toString(),
            entity: file,
            type: 'file',
            project: project,
            language: language,
            is_write: isWrite ? true : false,
            lines: lines,
        });
        lastAction = timestamp;
        lastFile = file;
        checkActivePause();
    }

    function enoughTimePassed() {
        return lastAction + 120000 < Date.now();
    }
      
    function isIdle() {
        return lastAction + idleTime < Date.now();
    }  

    function handleAction(isWrite) {
        var currentDocument = DocumentManager.getCurrentDocument();
        if (currentDocument) {
            var file = currentDocument.file;
            if (file && file.isFile) {
                var timestamp = Date.now();
                if (isWrite || enoughTimePassed() || lastFile !== file.fullPath) {
                    var language = currentDocument.language ? currentDocument.language.getName() : undefined;
                    var project = ProjectManager.getProjectRoot() ? ProjectManager.getProjectRoot().name : undefined;
                    var editor = currentDocument._masterEditor;
                    var lines = editor ? editor.lineCount() : undefined;
                    sendHeartbeat(file.fullPath, timestamp, project, language, isWrite, lines);
                }
            }
        }
    }

    init();

});
