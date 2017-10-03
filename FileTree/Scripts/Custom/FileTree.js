"use strict";

var FileTree = (function () {
    //Model
    var TreeEntry = function (name, parent = null, isFolder = false, children = []) {
        this.name = name;
        this.parent = parent;
        this.isFolder = isFolder;
        this.children = children;
    }

    TreeEntry.prototype.addChild = function (treeEntry, position = -1) {
        if (!this.isFolder || position > this.children.length)
            return this;
        if (typeof treeEntry === 'string') {
            treeEntry = new TreeEntry(treeEntry, this);
        };

        if (position == -1) {
            this.children.push(treeEntry);
        } else {
            this.children.splice(position, 0, treeEntry);
        }
        return this;
    }

    //View
    var viewFileTree = function (treeEntry) {
        var node;
        if (!treeEntry.isFolder) {
             node = $('<div/>', {
                text: treeEntry.name,
                class: 'ident'
             });
        } else {
            node = $('<div/>', {
                text: treeEntry.name,
                class: 'ident'
            })
                .append(treeEntry.children.map(viewFileTree));
        }
        return node;
    };

    //Event handling
    var onDocumentReady = function() {
        var node = $("#root");
        node.text = "I am root!";

        var fileTree = new FileTree.TreeEntry("/", null, true);
        fileTree.addChild("/usr");
        fileTree.addChild("/home");

        node.append(FileTree.viewFileTree(fileTree));
    }

    return {   
        TreeEntry: TreeEntry,
        viewFileTree: viewFileTree,
        onDocumentReady: onDocumentReady
    }
})();

$(document).ready(FileTree.onDocumentReady)