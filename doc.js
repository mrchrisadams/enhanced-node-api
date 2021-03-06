/**
 * A ManPageFilter for the Man-Pages created with Ronn. Made for node.JS.
 * 
 * About: http://dracoblue.net/dev/enhanced-api-browser-for-nodejs/168/
 * 
 * Copyright (c) 2010 by DracoBlue (JanS@DracoBlue.de). Licensed under the terms
 * of MIT.
 */
var ManPageFilter = function() {
    var self = this;
    
    this.man_content_container = $('#man-content');
    this.filter_box_relative = $('#toctitle');

    this.element_navigation_node = null;
    this.elements = null;
    this.element_search_texts = null;

    this.elements_first_header_index = null;

    this.table_of_contents = null;

    this.initializeData();

    this.filter_box_relative.after(this.table_of_contents);

    this.search_result_info = this.setupSearchResultInfo();
    var search_field = this.setupSearchField();

    this.filter_box_relative.after($('<input type="button" style="float:left; width: 22px; margin-left: 5px" value="X" />').click(function() {
        search_field.val('');
        self.filterForText('');
        search_field.focus();
    }));
    this.filter_box_relative.after(search_field);
    this.filter_box_relative.after($('<div style="font-size: 70%">Filter:</div>'));
    $('h1').after(this.search_result_info);

    this.setupFloatingSectionHeader();
    
    this.setupUnofficialNotice();
    search_field.focus();
};

ManPageFilter.prototype.setupSearchResultInfo = function() {
    return $('<div style="display: none; background-color: #121314; padding: 10px;" />');
};

ManPageFilter.prototype.setupSearchField = function() {
    var self = this;

    var search_field = $('<input style="float:left; width: 140px; margin-bottom: 10px;" />');

    this.previous_text = "";

    var checkForSearchChangeHandler = function(event) {
        var text = search_field.val().toLowerCase();
        if (self.previous_text === text) {
            return;
        }

        self.filterForText(text);
    };

    var check_for_search_change_handler_timer = null;

    var delayedCheckForSearchChangeHandler = function() {
        if (check_for_search_change_handler_timer) {
            clearTimeout(check_for_search_change_handler_timer);
        }
        check_for_search_change_handler_timer = setTimeout(checkForSearchChangeHandler, 200);
    };

    search_field.keyup(delayedCheckForSearchChangeHandler).change(delayedCheckForSearchChangeHandler);

    var search_field_has_focus = false;
    
    search_field.focus(function() {
        search_field_has_focus = true;
    });
    search_field.blur(function() {
        search_field_has_focus = false;
    });
    $(document).keydown(function(event) {
        if (event.keyCode === 70 && !search_field_has_focus) {
            search_field.focus();
            
            if (event.shiftKey) {
                search_field.val('');
                self.filterForText('');
            } else {
                search_field.select();
            }
            
            event.preventDefault();
            return false;
        }
    });
    
    return search_field;
};

ManPageFilter.prototype.filterForText = function(text) {
    this.previous_text = text;
    
    var u = new Date();
    
    this.man_content_container.css('visibility', 'hidden');
    
    var elements_found = 0;
    
    if (text === '') {
        elements_found = this.showAllElements();
    } else {
        elements_found = this.filterElements(text);
    }
    
    if (elements_found === this.elements.length) {
        this.search_result_info.slideUp();
    } else {
        this.search_result_info.text([
            'Filtered Results: Hiding ', Math.floor(10000 - elements_found * 10000 / this.elements.length) / 100, '% (took ',
            ((new Date()).getTime() - u.getTime()), 'ms)'
        ].join(''));
    
        this.search_result_info.slideDown();
    }
    
    this.triggerScrollHandler();
    
    this.man_content_container.css('visibility', '');
};

/**
 * Do not hide any elements in navigation nor in man content.
 */
ManPageFilter.prototype.showAllElements = function() {
    var elements = this.elements;
    var elements_length = elements.length;
    var element_navigation_node = this.element_navigation_node;

    for ( var i = this.elements_first_header_index; i < elements_length; i++) {
        element = elements[i];
        element.style.display = '';
        if (element_navigation_node[i] !== false) {
            element_navigation_node[i].style.display = '';
        }
    }
    return elements_length;
};

/**
 * Show only those elements in man content, which fit to that filter. Hide also
 * navigation nodes, which are not useful.
 */
ManPageFilter.prototype.filterElements = function(text) {
    var elements = this.elements;
    var elements_length = elements.length;
    var element_navigation_node = this.element_navigation_node;
    var element_search_texts = this.element_search_texts;
    var elements_found = 0;

    for ( var i = this.elements_first_header_index; i < elements_length; i++) {
        element = elements[i];
        if (element_search_texts[i].indexOf(text) === -1) {
            element.style.display = 'none';
            if (element_navigation_node[i] !== false) {
                element_navigation_node[i].style.display = 'none';
            }
        } else {
            element.style.display = '';
            elements_found++;
            if (element_navigation_node[i] !== false) {
                element_navigation_node[i].style.display = '';
            }
        }
    }

    return elements_found;
};

/**
 * Show the information, that this is not the official source of the nodejs api,
 * but an enhanced viewer.
 */
ManPageFilter.prototype.setupUnofficialNotice = function() {
    var relative_element = $('h1');
    var info_box_html = [
        '<div style="padding: 10px;">This is not the official location of the ', $('#toctitle').text(),
        ' API <a href="http://nodejs.org/api.html">nodejs.org/api.html</a>, but an enhanced viewer.',
        ' Created by <a href="http://dracoblue.net">DracoBlue</a>, 2010.</div>'
    ].join('');

    $('h1').after($(info_box_html));
};

/**
 * Take a given element (is either h2, h3 or h4) and create a navigation node
 * for this element.
 */
ManPageFilter.prototype.createNavigationNode = function(element, level) {
    element = $(element);

    var new_navigation_element = $('<li />');
    new_navigation_element.addClass('topLevel');

    var new_navigaton_element_link = $('<a href="#' + element.attr('id') + '" />');
    new_navigaton_element_link.text(element.text().replace(/\(.*\)$/gi, ""));

    if (level === 1) {
        this.headlines.push([element, new_navigation_element]);
    }
    
    new_navigaton_element_link.click(function(event) {
        /*
         * It's unknown, because invisible? Let's go to top!
         */
        if (element.css('display') === 'none') {
            $('#man').animate({
                scrollTop: 0
            }, 500);
        } else {
            var targetOffset = element.offset().top + $('#man').scrollTop();
            $('#man').animate({
                scrollTop: targetOffset
            }, 200);
        }
        event.preventDefault();
        return true;
    });

    new_navigation_element.append(new_navigaton_element_link);

    return new_navigation_element[0];
};

/**
 * As soon as we notice that a specific navigation node with a parent is
 * reached, we create a expandable children navigation node and return it.
 */
ManPageFilter.prototype.createSubNavigation = function(parent_navigation_node) {
    var children_node = $('<ul style="display: none" />');
    /**
     * The +/- button to toggle the parent's open/closed state.
     */
    var open_parent_node = $('<a href="#" class="toggler">+</a>');
    open_parent_node.click(function(event) {
        var is_open = children_node.css('display') === 'none' ? false : true;

        if (is_open) {
            open_parent_node.text('+');
            children_node.slideUp();
        } else {
            open_parent_node.text('-');
            children_node.slideDown();
        }
        event.preventDefault();
        return false;
    });

    parent_navigation_node.prepend(open_parent_node);
    parent_navigation_node.append(children_node);

    parent_navigation_node.removeClass('topLevel');

    return children_node;
};

/**
 * This function collects all information we now about the structure and
 * contents of the man page. It also initializes the search index.
 */
ManPageFilter.prototype.initializeData = function() {
    var self = this;

    /*
     * Idea:
     * 
     * The markup is something like this: <h2>Section 1</h2> <p>Text</p>
     * <h3>SubSection 1.1</h3> <pre> <code>...</code> </pre> <h2>Section 2</h2>
     * 
     * So the sections are just grouped in order of occurrence.
     * 
     * To make the filtering faster (then looping through the dom every time),
     * we'll store all elements and their contents in a simple map and iterate
     * over this one then.
     */

    /**
     * All children in the #man-element.
     */
    var elements = this.man_content_container.children();
    this.elements = elements;

    /**
     * We'll store the length for performance reasons.
     */
    var elements_length = elements.length;

    /**
     * The current level (0 is root, 1 is lowest and so on)
     */
    var level = 0;

    /**
     * The next level (what our new header element has)
     */
    var new_level = 0;

    /**
     * The tag name of the current element
     */
    var tag_name = null;

    /**
     * The current element
     */
    var element = null;

    /**
     * The new navigation element, we create for the current element.
     */
    var new_navigation_element = null;

    /**
     * A small helper map, we'll use to check whether a tag is a header or not.
     */
    var is_header_tag = {
        "h2": true,
        "h3": true,
        "h4": true
    };

    /*
     * To know which (navigation/dom) items to hide, when a specific filter is
     * applied, we'll store some extra information while we are walking through
     * the nodes.
     * 
     * Those are suffixed with stack. The first element [0] is always the root
     * node.
     * 
     * The stack is like a bread crumb for the current element.
     */

    this.table_of_contents = $('<ul style="clear: both"/>')[0];

    this.headlines = [];
    
    /**
     * Stack contains the dom_element for the parent, which holds all children
     */
    var navigation_stack = [];
    navigation_stack.push(this.table_of_contents);
    /**
     * Stack contains the search-text for the parents.
     */
    var navigation_text_stack = [
        ''
    ];

    /**
     * Stack contains the position in the elements-variable for each parent.
     */
    var navigation_parent_stack = [
        0
    ];

    /**
     * A map which contains the search-texts for each element (is a array while
     * creation and finally a gets joined into a string).
     */
    var element_search_texts = {};
    this.element_search_texts = element_search_texts;

    /**
     * A map, which contains the navigation node, which is connected with an
     * element.
     */
    var element_navigation_node = {};
    this.element_navigation_node = element_navigation_node;

    /*
     * Let's fill all those maps with content now ...
     */

    for ( var i = 0; i < elements_length; i++) {
        element = elements[i];
        tag_name = element.tagName.toLowerCase();
        element = $(element);
        element_id = element.text().replace(/\(.*\)$/gi, "").replace(/[\s\.]+/gi, "-").toLowerCase() + "-" + i;
        element.attr('id', element_id);
        element_search_texts[i] = [];
        element_lowercase_text = element.text().toLowerCase();

        if (typeof is_header_tag[tag_name] !== 'undefined') {
            new_level = Number(tag_name.substr(1, 1)) - 1;
            
            /*
             * Let's remember where we started with headings, so we won't hide
             * anything except the content.
             */
            if (this.elements_first_header_index === null) {
                this.elements_first_header_index = i;
            }

            if (new_level === level + 1) {
                // we reached just a new level!
                level++;
            } else if (new_level === level) {
                // we are at the same level :(
                navigation_stack = navigation_stack.splice(0, new_level);
                navigation_text_stack = navigation_text_stack.splice(0, new_level);
                navigation_parent_stack = navigation_parent_stack.splice(0, new_level);
            }

            if (new_level < level) {
                /*
                 * Let's increase the depth!
                 */
                navigation_stack = navigation_stack.splice(0, new_level);
                navigation_text_stack = navigation_text_stack.splice(0, new_level);
                navigation_parent_stack = navigation_parent_stack.splice(0, new_level);
                level = new_level;
            }

            /*
             * Finally all depth issues are resolved, now let's create the node.
             */

            element_navigation_node[i] = this.createNavigationNode(element, level);

            /*
             * Ok, we don't have that <ul> for the children, yet.
             */
            if (navigation_stack[level - 1] === true) {
                navigation_stack[level - 1] = this.createSubNavigation($(element_navigation_node[navigation_parent_stack[level - 1]]));
            }
            $(navigation_stack[level - 1]).append(element_navigation_node[i]);

            /*
             * We'll put true on the stack, and in case we add children, we'll
             * check for that
             */
            navigation_stack.push(true);

            navigation_text_stack.push(element_lowercase_text);

            navigation_parent_stack.push(i);
        } else {
            element_navigation_node[i] = false;
        }

        /*
         * Update the search index for the element and add the entire bread
         * crumbs to it.
         */
        element_search_texts[i].push(navigation_text_stack.join(' '));

        /*
         * Now inject the element's content also as search value for most parent
         * nodes (except root).
         */
        var navigation_parent_stack_length = navigation_parent_stack.length;
        for ( var p = 1; p < navigation_parent_stack_length; p++) {
            element_search_texts[navigation_parent_stack[p]].push(element_lowercase_text);
        }

        /*
         * Update the search index text for the element to it's own text
         */
        element_search_texts[i].push(element_lowercase_text);
    }

    /*
     * Now we have to join the element_search_texts.
     */
    for ( var e = 0; e < elements_length; e++) {
        element_search_texts[e] = element_search_texts[e].join(' ');
    }
};

/**
 * If a scroll was performed, we want to check whether we are in a new
 * section or not. This handler performs this operation, highlights
 * the current section and adds a floating header.
 */
ManPageFilter.prototype.setupFloatingSectionHeader = function() {
    var self = this;
    var scroll_timeout = null;
    
	var headlines = this.headlines;
    var headlines_length = headlines.length;

    var last_current_section = null;
    var last_current_section_link = null;
    
    var floating_header = null;

    /**
     * Handler to perform the floating header and selected section work
     * on the navigation.
     */
    this.onScrollHandler = function() {
        var body_center = $('body').scrollTop()+10;

        var current_section = null;
        var current_section_li = null;
        
        for (var i = 0; i < headlines_length; i++) {
            var headline = headlines[i][0];
            var headline_li = headlines[i][1];
            if (headline.css('display') !== 'none') {
                if (headline.offset().top < body_center) {
                    current_section = headline;
                    current_section_li = headline_li;
                }
            }
        }
        
        if (current_section === null) {
            if (floating_header) {
                floating_header.remove();
                floating_header = null;
                last_current_section_li.removeClass('active');
            }
        } else {
            if (last_current_section !== current_section) {
                if (floating_header) {
                    floating_header.remove();
                    last_current_section_li.removeClass('active');
                }
                floating_header = current_section.clone();
                floating_header.width(current_section.width());
                floating_header.addClass('current-section');
                current_section.after(floating_header);
                current_section_li.addClass('active');
            }
        }
        
        last_current_section = current_section;
        last_current_section_li = current_section_li;
    };

    
	this.triggerScrollHandler();
	
	$('#man').scroll(function() {
	    self.triggerScrollHandler()
	});
};

/**
 * Trigger the scroll handler. This one won't be executed right away, but waits
 * 200ms until it really executes the onScrollHandler. This is necessary, because
 * scroll is triggered way to often.
 */
ManPageFilter.prototype.triggerScrollHandler = (function() {
    var scroll_timeout = null;
    return function() {
        if (scroll_timeout) {
            clearTimeout(scroll_timeout);
        }
        scroll_timeout = setTimeout(this.onScrollHandler, 200);
    };
})();

new ManPageFilter();

setTimeout(function()
{
    sh_highlightDocument();
}, 100);
