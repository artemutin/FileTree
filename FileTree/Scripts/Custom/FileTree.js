"use strict";

var FileTree = (function () {
    //Model
    var uniquePrefix = "veryUniquePrefix";
    var treeEntryId = 0;
    var idToRefMappingStorage = {};
    var domReady = false;
    var deflatedFileTree = null;
    

    var TreeEntry = function (Id, name, parent = null, children = null) {
        this.name = name;
        this.parent = parent;
        this.children = children;
        this.isHovered = false;
        this.Id = Id;
        idToRefMappingStorage[Id] = this;
        
    }

    TreeEntry.prototype.isFolder = function(){
        return this.children !== null;
    }

    TreeEntry.prototype.addChild = function (treeEntry, isFolder=false, position = -1) {
        if (!this.isFolder() || position > this.children.length)
            return this;
        if (typeof treeEntry === 'string') {
            treeEntry = new TreeEntry(treeEntry, this, []);
        };
        //this.children = this.children === null ? [] : this.children; 
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

    TreeEntry.prototype.switchOfIsHovered = function () {
        this.isHovered = false;
        if (this.parent !== null) {
            this.parent.switchOfIsHovered;
        };
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
        var treeEntry = new TreeEntry(deflatedFileTree.Id, deflatedFileTree.Name, parent, deflatedFileTree.IsFolder ? [] : null);
        if (deflatedFileTree.IsFolder) {
            treeEntry.children = deflatedFileTree.Children.sort(function (a, b) {
                return a.Position > b.Position
            }).map(function (val) {
                return inflateFileTree(val, treeEntry);
            });
        }
        
        return treeEntry;
    };

    //View

    var viewFileTree = function (treeEntry) {
        var node;

        if (!treeEntry.isFolder()) {
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

        var droppableHandlers = treeEntry.getDroppableHandlers();
        node.droppable({
            drop: droppableHandlers.dropHandler,
            over: droppableHandlers.overHandler,
            out: droppableHandlers.outHandler,
            greedy: true,
            tolerance: "intersect"
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

    TreeEntry.prototype.getDroppableHandlers = function () {
        var treeEntry = this;

        function dropHandler(event, ui) {
            if (ui.helper.is(".dropped")) {
                return;//to prevent some glitchy event propagation, we marked helper(which is cloned) as dropped on first handler call
            } else {
                ui.helper.addClass("dropped");
            }
            var whatsDropped = ui.draggable;
            var position = -1;
         
            //update DOM part
            if (treeEntry.isFolder() && treeEntry.isHovered) {
                var whereDropped = $("#" + treeEntry.getDomID());
                whereDropped.append(whatsDropped);
            } else {
                //dropped on some file item inside directory
                whereDropped = $("#" + treeEntry.getDomID());
                whatsDropped.insertAfter(whereDropped);
                position = whereDropped.index();
                whereDropped = whereDropped.parent();//now it points to folder, which contains item being dropped on
            }

            whereDropped.children(".tree_icon").hide();
            whereDropped.prepend('<i class="fa fa-refresh fa-spin fa-1x fa-fw" aria-hidden="true"></i>');

            //update our model
            treeEntry.switchOfIsHovered();
            whatsDropped = getModelRefFromDomID(whatsDropped.attr("id"));
            whatsDropped.removeFromParent();
            
            if (treeEntry.isFolder()) {
                treeEntry.addChild(whatsDropped);
            } else {
                treeEntry.parent.addChild(whatsDropped, false, position);
            }
            sendDropResultToServer(whatsDropped, position, whereDropped);
            console.log(treeEntry);
        };

        function overHandler(event, ui) {
            treeEntry.isHovered = true;
        }

        function outHandler(event, ui) {
            treeEntry.isHovered = false;
        }

        return {
            dropHandler: dropHandler,
            overHandler: overHandler,
            outHandler: outHandler
        }
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