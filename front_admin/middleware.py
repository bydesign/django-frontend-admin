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

        # Skip templates that we are generating through the debug toolbar.
        if (isinstance(template.name, six.string_types) and
                template.name.startswith('front_admin/')):
            return

        context_list = {}
        for context_layer in context.dicts:
            temp_layer = {}
            try:
                for item in context_layer:
                    context_list[item] = force_text( context_layer[item] )
            except UnicodeEncodeError:
                pass

        self.templates.append({
            'context': context_list,
            'template': {
                'name': template.name,
                'source': template.source
            }
        })

    def process_request(self, request):
        # Decide whether the front admin is active for this request.
        template_rendered.connect(self._store_template_info)

    def process_view(self, request, view_func, view_args, view_kwargs):
        response = None
        return response


    def process_response(self, request, response):
        template_rendered.disconnect(self._store_template_info)

        if not show_frontadmin(request):
            return response

        # Check for responses where the toolbar can't be inserted.
        content_encoding = response.get('Content-Encoding', '')
        content_type = response.get('Content-Type', '').split(';')[0]
        if any((getattr(response, 'streaming', False),
                'gzip' in content_encoding,
                content_type not in _HTML_TYPES)):
            return response

        # Insert the toolbar in the response.
        content = force_text(response.content, encoding=settings.DEFAULT_CHARSET)
        insert_before = '</body>'
        pattern = re.escape(insert_before)
        bits = re.split(pattern, content, flags=re.IGNORECASE)
        if len(bits) > 1:
            fascript = '<link href="/static/front_admin/js/codemirror/lib/codemirror.css" rel="stylesheet" />\n'
            fascript += '<link href="/static/front_admin/js/codemirror/theme/duotone-light.css" rel="stylesheet" />\n'
            fascript += '<link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500" rel="stylesheet">\n'
            fascript += '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">\n'
            fascript += '<link href="/static/front_admin/css/default.css" rel="stylesheet">\n'
            fascript += '<script type="application/json" id="fa-data">' + json.dumps(self.templates) + '</script>\n'
            fascript += '<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/codemirror/codemirror.min.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/codemirror/addon/mode/overlay.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/codemirror/mode/django/django.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/builtin_tags.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/variable.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/parser.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/processor.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/default.js"></script>\n'
            fascript += '<script src="/static/front_admin/js/start.js"></script>\n'

            bits[-2] += fascript
            response.content = insert_before.join(bits)
            if response.get('Content-Length', None):
                response['Content-Length'] = len(response.content)
        return response
