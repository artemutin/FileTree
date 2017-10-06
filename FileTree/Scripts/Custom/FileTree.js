"use strict";

var FileTree = (function () {
    //Model
    var uniquePrefix = "veryUniquePrefix";
    var idToRefMappingStorage = {};
    var domReady = false;
    var deflatedFileTree = null;
    var lastLeavedElement = null;
    var helper = null;
    var fileIcon = $('<img class="tree_icon" src="Content/Images/file.png" />');
    var folderIcon = $('<img class="tree_icon" src="Content/Images/folder.png" />');

    

    var TreeEntry = function (Id, name, parent = null, children = null) {
        this.name = name;
        this.parent = parent;
        this.children = children;
        this.Id = Id;
        idToRefMappingStorage[Id] = this;

    };

    TreeEntry.prototype.isFolder = function () {
        return this.children !== null;
    };

    TreeEntry.prototype.addChild = function (treeEntry, isFolder = false, position = -1) {
        if (!this.isFolder() || position > this.children.length)
            return this;
        if (typeof treeEntry === 'string') {
            treeEntry = new TreeEntry(treeEntry, this, []);
        }

        if (position === -1) {
            this.children.push(treeEntry);
        } else {
            this.children.splice(position, 0, treeEntry);
        }
        treeEntry.parent = this;
        return this;
    };

    TreeEntry.prototype.removeFromParent = function () {
        if (this.parent !== null) {
            var that = this;
            this.parent.children = this.parent.children.filter(
                function (ref) { return ref !== that; }
            );
        }
    };

    TreeEntry.prototype.getDomID = function () {
        return uniquePrefix + this.Id;
    };

    TreeEntry.prototype.switchOfIsHovered = function () {
        $("#" + this.getDomID()).removeClass("hovered");
        if (this.parent !== null) {
            //this.parent.switchOfIsHovered();
        }
    };

    function getModelRefFromDomID(domId) {
        var re = /^\D+(\d+)$/;
        var id = re.exec(domId);
        if (id.length !== 2)
            return null;
        id = +id[1];
        return idToRefMappingStorage[id];
    }

    function inflateFileTree(deflatedFileTree, parent = null) {
        var treeEntry = new TreeEntry(deflatedFileTree.Id, deflatedFileTree.Name, parent, deflatedFileTree.IsFolder ? [] : null);
        if (deflatedFileTree.IsFolder) {
            treeEntry.children = deflatedFileTree.Children.sort(function (a, b) {
                return a.Position > b.Position;
            }).map(function (val) {
                return inflateFileTree(val, treeEntry);
            });
        }
        
        return treeEntry;
    }

    function clearLastLeavedElement() {
        if (lastLeavedElement !== null) {
            lastLeavedElement.removeClass("leaved_through_top leaved_through_bottom hovered");
        }
    }

    function getPositionFromLeavedElement() {
        var el = $(lastLeavedElement);
        var position = -1;

        if (el.hasClass("leaved_through_top")) {
            position = el.parent().children("div.ident").index(el);
        } else if (el.hasClass("leaved_through_bottom")) {
            position = el.parent().children("div.ident").index(el)+1;
        }

        var treeEntry = getModelRefFromDomID(el.attr("id"));
        
        return position;
    }

    //View

    var viewFileTree = function (treeEntry) {
        var node = $('<div/>', {
            text: treeEntry.name,
            class: 'ident',
            id: treeEntry.getDomID()
        }); 

        if (!treeEntry.isFolder()) {
            node.prepend(fileIcon.clone());
        } else {
            node.prepend(folderIcon.clone()).append(treeEntry.children.map(viewFileTree));
        }

        var droppableHandlers = treeEntry.getDroppableHandlers();
        node.draggable({
            containment: "#root",
            helper: function () {
                if (treeEntry.isFolder()) {
                    return $('<div/>', {class: 'ident'}).text(treeEntry.name).prepend(fileIcon.clone());
                } else {
                    return $('<div/>', { class: 'ident' }).text(treeEntry.name).prepend(folderIcon.clone());
                }
            },
            start: droppableHandlers.startHandler
        });

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
                    whereDropped.children(".tree_icon").show();
                    whereDropped.children("i").remove();
                },
                error: function (jqXHR, status) {
                    console.error(status);
                }
            });
    }

    TreeEntry.prototype.getDroppableHandlers = function () {
        var treeEntry = this;

        function dropHandler(event, ui) {
            if (ui.helper.hasClass("dropped")) {
                return;//stops glitchy event propagation
            } else {
                ui.helper.addClass("dropped");
            }
            var whatsDropped = ui.draggable;
            var position = -1;

            //update DOM part
            if (treeEntry.isFolder()) {
                var whereDropped = $("#" + treeEntry.getDomID());
                if (lastLeavedElement && lastLeavedElement.parent().is(whereDropped)) {
                    position = getPositionFromLeavedElement();
                    
                    $(whereDropped.children("div.ident")).eq(position).before(whatsDropped);
                } else {
                    whereDropped.append(whatsDropped);
                }
            } else {
                //dropped on some file item inside directory
                whereDropped = $("#" + treeEntry.getDomID());
                whatsDropped.insertAfter(whereDropped);
                position = whereDropped.index();
                whereDropped = whereDropped.parent();//now it points to folder, which contains item being dropped on
            }

            whereDropped.children(".tree_icon").hide();
            whereDropped.prepend('<i class="fa fa-refresh fa-spin fa-1x fa-fw" aria-hidden="true"></i>');
            clearLastLeavedElement();

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
            console.log(position);
        }

        function overHandler(event, ui) {
            if (lastLeavedElement && $(event.target) === lastLeavedElement.parent()) {
                event.stopPropagation();
            }
            
            $(event.target).addClass("hovered");
        }

        function startHandler(event, ui) {
            event.stopImmediatePropagation();
            //$(event.target).find("*").draggable("disable");
            helper = ui.helper;
        }

        function outHandler(event, ui) {
            event.stopPropagation();
            treeEntry.isHovered = false;
            var leavedElement = $(event.target);
            leavedElement.removeClass("hovered");

            clearLastLeavedElement();
            var coords = leavedElement.offset();
            if (helper.offset().top < coords.top) {
                leavedElement.addClass("leaved_through_top");
            } else {
                leavedElement.addClass("leaved_through_bottom");
            }

            lastLeavedElement = leavedElement;

        }

        return {
            dropHandler: dropHandler,
            overHandler: overHandler,
            outHandler: outHandler,
            startHandler: startHandler
        };
    };

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
            deflatedFileTree = null;
            node.append(viewFileTree(fileTree));
        }
    };

    $.ajax("TreeEntries", {
        dataType: "json",
        success: startingCallback,
        error: function (jqXHR, status) {
            console.error(status);
        }
    });

    return {
        onDocumentReady: startingCallback
    };
})();

$(document).ready(FileTree.onDocumentReady);