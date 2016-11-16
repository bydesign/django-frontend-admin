"""
Front Admin middleware
"""

from __future__ import absolute_import, unicode_literals

import re
import threading

from django import http
from django.conf import settings
from django.utils import six
from django.utils.encoding import force_text
from django.utils.functional import cached_property
from django.utils.module_loading import import_string
from django.test.signals import template_rendered
from django.db.models.query import QuerySet, RawQuerySet
from django.utils.translation import ugettext_lazy as _
from pprint import pformat
import json

#from debug_toolbar import settings as dt_settings
#from debug_toolbar.toolbar import DebugToolbar

try:
    from django.utils.deprecation import MiddlewareMixin
except ImportError:  # Django < 1.10
    # Works perfectly for everyone using MIDDLEWARE_CLASSES
    MiddlewareMixin = object


_HTML_TYPES = ('text/html', 'application/xhtml+xml')


def show_frontadmin(request):
    """
    Default function to determine whether to show the toolbar on a given page.
    """
    if request.META.get('REMOTE_ADDR', None) not in settings.INTERNAL_IPS:
        return False

    if request.is_ajax():
        return False

    return bool(settings.DEBUG)


class FrontAdminMiddleware(MiddlewareMixin):
    """
    Middleware to set up Front Admin on incoming request and render toolbar
    on outgoing response.
    """
    def __init__(self, *args, **kwargs):
        super(FrontAdminMiddleware, self).__init__(*args, **kwargs)
        self.templates = []
        self.stats = {}

    def _store_template_info(self, sender, **kwargs):
        template, context = kwargs['template'], kwargs['context']
        #print template.name
        #print template.source
        #print context
        kwargs['template'] = {
            'name': template.name,
            'source': template.source
        }

        # Skip templates that we are generating through the debug toolbar.
        if (isinstance(template.name, six.string_types) and
                template.name.startswith('front_admin/')):
            return

        context_list = {}
        for context_layer in context.dicts:
            temp_layer = {}
            #print context_layer
            '''if hasattr(context_layer, 'items'):
                for key, value in context_layer.items():
                    # Replace any request elements - they have a large
                    # unicode representation and the request data is
                    # already made available from the Request panel.
                    if isinstance(value, http.HttpRequest):
                        temp_layer[key] = '<<request>>'
                    # Replace the debugging sql_queries element. The SQL
                    # data is already made available from the SQL panel.
                    elif key == 'sql_queries' and isinstance(value, list):
                        temp_layer[key] = '<<sql_queries>>'
                    # Replace LANGUAGES, which is available in i18n context processor
                    elif key == 'LANGUAGES' and isinstance(value, tuple):
                        temp_layer[key] = '<<languages>>'
                    # QuerySet would trigger the database: user can run the query from SQL Panel
                    elif isinstance(value, (QuerySet, RawQuerySet)):
                        model_name = "%s.%s" % (
                            value.model._meta.app_label, value.model.__name__)
                        temp_layer[key] = '<<%s of %s>>' % (
                            value.__class__.__name__.lower(), model_name)
                    else:
                        try:
                            recording(False)
                            pformat(value)  # this MAY trigger a db query
                        except SQLQueryTriggered:
                            temp_layer[key] = '<<triggers database query>>'
                        except UnicodeEncodeError:
                            temp_layer[key] = '<<unicode encode error>>'
                        except Exception:
                            temp_layer[key] = '<<unhandled exception>>'
                        else:
                            temp_layer[key] = value
                        finally:
                            recording(True)'''
            try:
                for item in context_layer:
                    context_list[item] = force_text( context_layer[item] )
                #context_list.append(pformat(context_layer))
            except UnicodeEncodeError:
                pass

        print json.dumps(context_list)
        #for item in context_list:
        #    print item

        kwargs['context'] = [force_text(item) for item in context_list]
        #context = [force_text(item) for item in context_list]
        #kwargs['context_processors'] = getattr(context, 'context_processors', None)
        self.templates.append(kwargs)

    #@cached_property
    #def show_frontadmin(self):
        # If SHOW_TOOLBAR_CALLBACK is a string, which is the recommended
        # setup, resolve it to the corresponding callable.
    #    func_or_path = dt_settings.get_config()['SHOW_FRONTADMIN_CALLBACK']
    #    if isinstance(func_or_path, six.string_types):
    #        return import_string(func_or_path)
    #    else:
    #        return func_or_path

    def process_request(self, request):
        # Decide whether the front admin is active for this request.
        #if not self.show_frontadmin(request):
        #    return

        #toolbar = DebugToolbar(request)
        #self.__class__.debug_toolbars[threading.current_thread().ident] = toolbar

        # Activate instrumentation ie. monkey-patch.
        template_rendered.connect(self._store_template_info)

        # Run process_request methods of panels like Django middleware.
        #response = None
        #for panel in toolbar.enabled_panels:
        #    response = panel.process_request(request)
        #    if response:
        #        break
        #return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        #toolbar = self.__class__.debug_toolbars.get(threading.current_thread().ident)
        #if not toolbar:
        #    return

        # Run process_view methods of panels like Django middleware.
        response = None
        #panel.
        #for panel in toolbar.enabled_panels:
        #    response = panel.process_view(request, view_func, view_args, view_kwargs)
        #    if response:
        #        break
        return response

    def generate_stats(self, request, response):
        template_context = []
        #print self.templates
        for template_data in self.templates:
            info = {}
            # Clean up some info about templates
            #print template_data
            template = template_data.get('template', None)
            #print template
            #if hasattr(template, 'origin') and template.origin and template.origin.name:
            #    template.origin_name = template.origin.name
            #else:
            #    template.origin_name = _('No origin')
            info['template'] = template
            # Clean up context for better readability
            #if self.toolbar.config['SHOW_TEMPLATE_CONTEXT']:
            context_list = template_data.get('context', [])
            info['context'] = '\n'.join(context_list)
            template_context.append(info)

        # Fetch context_processors/template_dirs from any template
        if self.templates:
            context_data = {}
            #print self.templates
            context_processors = self.templates[0]['context_processors']
            for key in context_processors:
                #print context_processors[key]
                for key2 in context_processors[key]:
                    #print context_processors[key][key2]
                    context_data[key2] = context_processors[key][key2]

            #print context_data
            #template_dirs = self.templates[0]['template'].engine.dirs
        else:
            context_processors = None
            #template_dirs = []

        self.record_stats({
            'templates': template_context,
            #'template_dirs': [normpath(x) for x in template_dirs],
            'context_processors': context_processors,
        })

    def record_stats(self, stats):
        """
        Store data gathered by the panel. ``stats`` is a :class:`dict`.

        Each call to ``record_stats`` updates the statistics dictionary.
        """
        self.stats = stats
        #self.stats.setdefault(1, {}).update(stats)

    def process_response(self, request, response):
        #toolbar = self.__class__.debug_toolbars.pop(threading.current_thread().ident, None)
        #if not toolbar:
        #    return response

        template_rendered.disconnect(self._store_template_info)



        # Run process_response methods of panels like Django middleware.
        #for panel in reversed(toolbar.enabled_panels):
        #    new_response = panel.process_response(request, response)
        #    if new_response:
        #        response = new_response

        # Deactivate instrumentation ie. monkey-unpatch. This must run
        # regardless of the response. Keep 'return' clauses below.
        # (NB: Django's model for middleware doesn't guarantee anything.)
        #for panel in reversed(toolbar.enabled_panels):
        #    panel.disable_instrumentation()

        # Check for responses where the toolbar can't be inserted.
        content_encoding = response.get('Content-Encoding', '')
        content_type = response.get('Content-Type', '').split(';')[0]
        if any((getattr(response, 'streaming', False),
                'gzip' in content_encoding,
                content_type not in _HTML_TYPES)):
            return response

        # Collapse the toolbar by default if SHOW_COLLAPSED is set.
        #if toolbar.config['SHOW_COLLAPSED'] and 'djdt' not in request.COOKIES:
        #    response.set_cookie('djdt', 'hide', 864000)

        # Insert the toolbar in the response.
        content = force_text(response.content, encoding=settings.DEFAULT_CHARSET)
        #insert_before = dt_settings.get_config()['INSERT_BEFORE']
        insert_before = '</body>'
        pattern = re.escape(insert_before)
        bits = re.split(pattern, content, flags=re.IGNORECASE)
        if len(bits) > 1:
            # When the toolbar will be inserted for sure, generate the stats.
            #for panel in reversed(toolbar.enabled_panels):
            #    panel.generate_stats(request, response)

            self.generate_stats(request, response)

            bits[-2] += self.render_admin()
            response.content = insert_before.join(bits)
            if response.get('Content-Length', None):
                response['Content-Length'] = len(response.content)
        return response


    def render_admin(self):
        #for stat in self.stats:
        #    print stat
        #print self.stats
        response = json.dumps(self.stats)
        return response
