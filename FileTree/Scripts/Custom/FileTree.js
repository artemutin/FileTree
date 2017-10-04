"use strict";

var FileTree = (function () {
    //Model
    var uniquePrefix = "veryUniquePrefix";
    var treeEntryId = 0;
    var idToRefMappingStorage = {};
    var domReady = false;
    var deflatedFileTree = null;
    

    var TreeEntry = function (Id, name, parent = null, isFolder = false, children = []) {
        this.name = name;
        this.parent = parent;
        this.isFolder = isFolder;
        this.children = children;
        this.Id = Id;
        idToRefMappingStorage[Id] = this;
        //treeEntryId += 1;
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
        treeEntry.parent = this;
        return this;
    }

    TreeEntry.prototype.removeFromParent = function () {
        if (this.parent !== null) {
            var that = this;
            this.parent.children = this.parent.children.filter(
                function (ref) { return ref !== that }
            );
        }
    }

    TreeEntry.prototype.getDomID = function(){
        return uniquePrefix + this.Id;
    }

    function getModelRefFromDomID(domId) {
        var re = /^\D+(\d+)$/;
        var id = re.exec(domId);
        if (id.length !== 2)
            return null;
        id = +id[1]
        return idToRefMappingStorage[id];
    }

    function inflateFileTree(deflatedFileTree, parent = null) {
        var treeEntry = new TreeEntry(deflatedFileTree.Id, deflatedFileTree.Name, parent, deflatedFileTree.IsFolder);
        treeEntry.children = deflatedFileTree.Children.sort(function (a, b) {
            return a.Position > b.Position
        }).map(function (val) {
            return inflateFileTree(val, treeEntry);
        });
        return treeEntry;
    };

    //View

    var viewFileTree = function (treeEntry) {
        var node;

        if (!treeEntry.isFolder) {
            node = $('<div/>', {
                text: treeEntry.name,
                class: 'ident',
                id: treeEntry.getDomID()
            }).prepend('<img class="tree_icon" src="Content/Images/file.png" />');
            
        } else {
            node = $('<div/>', {
                text: treeEntry.name,
                class: 'ident',
                id: treeEntry.getDomID(),
            }).prepend('<img class="tree_icon" src="Content/Images/folder.png" />')
                .append(treeEntry.children.map(viewFileTree));
        }

        node.draggable({
            containment: "#root",
            helper: "clone"
        });
        node.droppable({
            drop: treeEntry.getOnDropHandler(),
            greedy: true
        });
        return node;
    };

    //Event handling
    function sendDropResultToServer(movedTreeEntry, position, whereDropped) {
        $.ajax("TreeEntries/Move",
            {
                data: {
                    movedId: movedTreeEntry.Id,
                    newParentId: movedTreeEntry.parent.Id,
                    position: position
                },
                method: 'POST',
                success: function () {
                    console.log('Successfully updated');
                    whereDropped.children(".tree_icon").show();
                    whereDropped.children("i").remove();
                },
                error: function (jqXHR, status) {
                    console.error(status);
                }
            });
    };

    TreeEntry.prototype.getOnDropHandler = function () {
        var treeEntry = this;

        return function (event, ui) {
            var whatsDropped = ui.draggable;
            //update DOM part
            if (treeEntry.isFolder) {
                var whereDropped = $("#" + treeEntry.getDomID());
                whereDropped.append(whatsDropped);
            } else {
                whereDropped = $("#" + treeEntry.getDomID());
                whatsDropped.insertAfter(whereDropped);
            }

            whereDropped.children(".tree_icon").hide();
            whereDropped.prepend('<i class="fa fa-refresh fa-spin fa-1x fa-fw" aria-hidden="true"></i>')
            whatsDropped.css({ top: '0px', left: '20px' });

            //update our model
            whatsDropped = getModelRefFromDomID(whatsDropped.attr("id"));
            whatsDropped.removeFromParent();
            var position = -1;
            if (treeEntry.isFolder) {
                treeEntry.addChild(whatsDropped);
            } else {
                position = whereDropped.index();
                treeEntry.parent.addChild(whatsDropped, false, position);
            }
            sendDropResultToServer(whatsDropped, position, whereDropped);
            console.log(treeEntry);
        };
    }

    var startingCallback = function (arg) {
        if (typeof arg === "function") {
            //it's a call from jquery.ready()
            domReady = true;
        } else {
            //it's returned FileTree json
            deflatedFileTree = JSON.parse(arg)[0];
        }
        if (domReady && deflatedFileTree !== null) {
            //we are good to go
            var node = $("#root");
            node.children().remove();
            var fileTree = inflateFileTree(deflatedFileTree);
            node.append(viewFileTree(fileTree));
        }
    }

    $.ajax("TreeEntries", {
        dataType: "json",
        success: startingCallback,
        error: function (jqXHR, status) {
            console.error(status);
        }
    });

    return {   
        onDocumentReady: startingCallback
    }
})();

$(document).ready(FileTree.onDocumentReady)