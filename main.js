/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

define(function (require, exports, module) {
    "use strict";

    var VERSION = '0.1.0';

    var MainViewManager    = brackets.getModule("view/MainViewManager"),
        DocumentManager    = brackets.getModule("document/DocumentManager"),
        ProjectManager     = brackets.getModule("project/ProjectManager"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        CommandManager     = brackets.getModule("command/CommandManager"),
        Menus              = brackets.getModule("command/Menus");

    var lastAction         = 0,
        lastFile           = undefined;
  
    require('https://www.gstatic.com/firebasejs/3.6.3/firebase.js');
  
    var config = {
      apiKey: "AIzaSyDEc5ANSFNlg2iNyYW7nfwhwMTaEEhepoM",
      authDomain: "timetracker-ecd54.firebaseapp.com",
      databaseURL: "https://timetracker-ecd54.firebaseio.com",
      storageBucket: "timetracker-ecd54.appspot.com",
      messagingSenderId: "92200809868"
    };
    firebase.initializeApp(config);

    function init() { 

        setupEventListeners();

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
        console.log('Timetracker initialized');
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
    }

    function enoughTimePassed() {
        return lastAction + 120000 < Date.now();
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