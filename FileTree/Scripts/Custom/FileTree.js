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
            this.parent.switchOfIsHovered();
        }
    };

    TreeEntry.prototype.findChildPosition = function (child) {
        return this.children.findIndex(function (r) { return r === child; });
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
            position = el.parent().children("div.indent").index(el);
        } else if (el.hasClass("leaved_through_bottom")) {
            position = el.parent().children("div.indent").index(el) + 1;
        }

        var treeEntry = getModelRefFromDomID(el.attr("id"));

        return position;
    }

    function addIfMovingInsideSameFolder(droppedEntry, whereDroppedEntry, newPosition) {
        if (droppedEntry.parent === whereDroppedEntry) {
            var oldPosition = whereDroppedEntry.children.findIndex(function (r) { return r === droppedEntry; });
            if (oldPosition > -1 && oldPosition < newPosition) {
                return -1;
            }
        }
        return 0;
    }

    //View

    var viewFileTree = function (treeEntry) {
        var node = $('<div/>', {
            text: treeEntry.name,
            class: 'indent',
            id: treeEntry.getDomID()
        });

        if (!treeEntry.isFolder()) {
            node.prepend(fileIcon.clone());
        } else {
            node.addClass("folder").prepend(folderIcon.clone()).append(treeEntry.children.map(viewFileTree));
        }

        var droppableHandlers = treeEntry.getDroppableHandlers();
        node.draggable({
            containment: "#root",
            helper: function () {
                if (treeEntry.isFolder()) {
                    return $('<div/>', { class: 'border' }).text(treeEntry.name).prepend(fileIcon.clone());
                } else {
                    return $('<div/>', { class: 'border' }).text(treeEntry.name).prepend(folderIcon.clone());
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
    function sendDropResultToServer(movedTreeEntry, position, whereDroppedEl) {
        $.ajax("TreeEntries/Move",
            {
                data: {
                    movedId: movedTreeEntry.Id,
                    newParentId: movedTreeEntry.parent.Id,
                    position: position
                },
                method: 'POST',
                success: function () {
                    whereDroppedEl.children(".tree_icon").show();
                    whereDroppedEl.children("i").remove();
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

            var position = -1;
            var droppedEl = ui.draggable;
            var whereDroppedEntry = treeEntry;
            var droppedEntry = getModelRefFromDomID(droppedEl.attr("id"));
            var lastLeavedEntry = lastLeavedElement && getModelRefFromDomID(lastLeavedElement.attr("id"));
            if (whereDroppedEntry === droppedEntry) {
                return;//it shouldn't happen
            }

            var whereDroppedEl = $("#" + whereDroppedEntry.getDomID());

            //update DOM part
            if (whereDroppedEntry.isFolder()) {
                var justAppend = false;

                if (lastLeavedEntry && lastLeavedEntry.parent === whereDroppedEntry) {
                    position = getPositionFromLeavedElement();
                    var addition = addIfMovingInsideSameFolder(droppedEntry, whereDroppedEntry, position);
                    position += addition;
                    if (addition !== 0) {//detach and reselect to properly insert into DOM
                        droppedEl = droppedEl.detach();
                        whereDroppedEl = $("#" + whereDroppedEntry.getDomID());
                    }

                    var prepEl = $(whereDroppedEl.children("div.indent")).eq(position);
                    if (prepEl.length > 0) {
                        prepEl.before(droppedEl);
                    } else {
                        justAppend = true;
                    }
                } else {
                    justAppend = true;
                }

                if (justAppend) {
                    whereDroppedEl.append(droppedEl);//by default append to an end of folder
                }

            } else {
                //dropped on file item inside directory, will place dropped item after it
                position = whereDroppedEntry.parent.findChildPosition(whereDroppedEntry) + 1;
                position += addIfMovingInsideSameFolder(droppedEntry, whereDroppedEntry.parent, position);
                droppedEl.insertAfter(whereDroppedEl);
                whereDroppedEl = whereDroppedEl.parent();
            }

            whereDroppedEl.children(".tree_icon").hide();
            whereDroppedEl.prepend('<i class="fa fa-refresh fa-spin fa-1x fa-fw" aria-hidden="true"></i>');
            clearLastLeavedElement();
            whereDroppedEntry.switchOfIsHovered();

            //update our model
            
            droppedEntry.removeFromParent();

            if (whereDroppedEntry.isFolder()) {
                whereDroppedEntry.addChild(droppedEntry);
            } else {
                whereDroppedEntry.parent.addChild(droppedEntry, false, position);
            }
            sendDropResultToServer(droppedEntry, position, whereDroppedEl);
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