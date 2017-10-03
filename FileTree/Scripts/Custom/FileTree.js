"use strict";

var FileTree = (function () {
    var uniquePrefix = "veryUniquePrefix";
    var treeEntryId = 0;
    //Model
    var TreeEntry = function (name, parent = null, isFolder = false, children = []) {
        this.name = name;
        this.parent = parent;
        this.isFolder = isFolder;
        this.children = children;
        this.ID = treeEntryId;
        treeEntryId += 1;
    }

    TreeEntry.prototype.addChild = function (treeEntry, isFolder=false, position = -1) {
        if (!this.isFolder || position > this.children.length)
            return this;
        if (typeof treeEntry === 'string') {
            treeEntry = new TreeEntry(treeEntry, this, isFolder);
        };

        if (position == -1) {
            this.children.push(treeEntry);
        } else {
            this.children.splice(position, 0, treeEntry);
        }
        return this;
    }

    TreeEntry.prototype.getDomID = function(){
        return uniquePrefix + this.ID;
    }

    //View

    var viewFileTree = function (treeEntry) {
        var node;
        if (!treeEntry.isFolder) {
            node = $('<div/>', {
                text: treeEntry.name,
                class: 'ident',
                id: treeEntry.getDomID()
            });
            
        } else {
            node = $('<div/>', {
                text: treeEntry.name,
                class: 'ident',
                id: treeEntry.getDomID(),
            })
                .append(treeEntry.children.map(viewFileTree));
        }

        node.draggable({
            containment: "#root"
        });
        node.droppable({
            drop: treeEntry.getOnDropHandler(),
            greedy: true
        });
        return node;
    };

    //Event handling
    TreeEntry.prototype.getOnDropHandler = function () {
        var treeEntry = this;

        return function (event, ui) {
            var whatsDropped = ui.draggable;

            if (treeEntry.isFolder) {
                var whereDropped = $("#" + treeEntry.getDomID());
                whereDropped.append(whatsDropped);
            } else {
                whereDropped = $("#" + treeEntry.getDomID());
                whatsDropped.insertAfter(whereDropped);
            }
            var index = whatsDropped.index();
            whatsDropped.css({ top: '0px', left: '20px' });
        };
    }

    var onDocumentReady = function() {
        var node = $("#root");
        node.text = "I am root!";

        var fileTree = new FileTree.TreeEntry("/", null, true);
        fileTree.addChild("/usr", true);
        fileTree.addChild("fstab");
        fileTree.addChild(new TreeEntry("/home", null, true));
        fileTree.children[2].addChild("Downloads",true).addChild(".bashrc");

        node.append(FileTree.viewFileTree(fileTree));
    }

    return {   
        TreeEntry: TreeEntry,
        viewFileTree: viewFileTree,
        onDocumentReady: onDocumentReady
    }
})();

$(document).ready(FileTree.onDocumentReady)