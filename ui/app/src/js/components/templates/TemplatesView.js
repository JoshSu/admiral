/*
 * Copyright (c) 2016-2017 VMware, Inc. All Rights Reserved.
 *
 * This product is licensed to you under the Apache License, Version 2.0 (the "License").
 * You may not use this product except in compliance with the License.
 *
 * This product may include a number of subcomponents with separate copyright notices
 * and license terms. Your use of these subcomponents is subject to the terms and
 * conditions of the subcomponent's license, as noted in the LICENSE file.
 */

import TemplatesViewVue from 'components/templates/TemplatesViewVue.html';
import ListItemImageVue from 'components/templates/ListItemImageVue.html';
import ListItemContainerVue from 'components/templates/ListItemContainerVue.html';
import ListItemClosureVue from 'components/templates/ListItemClosureVue.html';
import TemplateDetailsView from 'components/templates/TemplateDetailsView'; // eslint-disable-line
import RegistryView from 'components/registries/RegistryView'; // eslint-disable-line
import TemplateImporterView from 'components/templates/TemplateImporterView'; // eslint-disable-line
import ContainerRequestForm from 'components/containers/ContainerRequestForm'; // eslint-disable-line
import ClosureRequestForm from 'components/closures/ClosureRequestForm'; // eslint-disable-line
import RequestsList from 'components/requests/RequestsList'; //eslint-disable-line
import EventLogList from 'components/eventlog/EventLogList'; //eslint-disable-line
import DeleteConfirmationSupportMixin from 'components/common/DeleteConfirmationSupportMixin';
import TemplateExport from 'components/templates/TemplateExport'; //eslint-disable-line
import VueAdapter from 'components/common/VueAdapter';
import GridHolderMixin from 'components/common/GridHolderMixin';
import constants from 'core/constants';
import utils from 'core/utils';
import ft from 'core/ft';
import {
  NavigationActions,
  RequestsActions,
  NotificationsActions,
  TemplateActions,
  TemplatesContextToolbarActions,
  HostContextToolbarActions
} from 'actions/Actions';

var TemplatesViewVueComponent = Vue.extend({
  template: TemplatesViewVue,
  props: {
    model: {
      required: true,
      type: Object,
      default: () => {
        return {
          listView: {},
          contextView: {}
        };
      }
    }
  },
  data: function() {
    var placeholderByCategory = {};
    placeholderByCategory[constants.TEMPLATES.SEARCH_CATEGORY.ALL] =
      i18n.t('app.template.list.searchImagesTemplatesPlaceholder');
    placeholderByCategory[constants.TEMPLATES.SEARCH_CATEGORY.IMAGES] =
      i18n.t('app.template.list.searchRepositoriesPlaceholder');
    placeholderByCategory[constants.TEMPLATES.SEARCH_CATEGORY.TEMPLATES] =
      i18n.t('app.template.list.searchTemplatesPlaceholder');
    placeholderByCategory[constants.TEMPLATES.SEARCH_CATEGORY.CLOSURES] =
      i18n.t('app.template.list.searchClosuresPlaceholder');

    var alertData = {};
    alertData.show = false;
    alertData.message = '';
    alertData.type = constants.ALERTS.TYPE.FAIL;

    return {
      constants: constants,
      placeholderByCategory: placeholderByCategory,
      // this view behaves better if the target width is set before the width transition
      requiresPreTransitionWidth: true,
      alert: alertData,
      createTemplateName: null,
      showTemplateExport: false,
      exportTemplateDocumentId: null
    };
  },
  computed: {
    activeContextItem: function() {
      return this.model.contextView && this.model.contextView.activeItem &&
        this.model.contextView.activeItem.name;
    },
    contextExpanded: function() {
      return this.model.contextView && this.model.contextView.expanded;
    },
    hasItems: function() {
      return this.model.listView.items && this.model.listView.items.length > 0;
    },
    queryOptions: function() {
      return this.model.listView && this.model.listView.queryOptions;
    },
    selectedCategory: function() {
      var queryOpts = this.queryOptions || {};
      return queryOpts[constants.SEARCH_CATEGORY_PARAM] ||
        constants.CONTAINERS.SEARCH_CATEGORY.ALL;
    },
    requestsCount: function() {
      var contextView = this.model.contextView;
      if (contextView && contextView.notifications) {
        return contextView.notifications.requests;
      }
      return 0;
    },
    eventLogsCount: function() {
      var contextView = this.model.contextView;
      if (contextView && contextView.notifications) {
        return contextView.notifications.eventlogs;
      }
      return 0;
    },
    showContextPanel: function() {
      return !this.model.registries &&
        !this.model.importTemplate &&
        (!this.model.selectedItemDetails ||
          this.model.selectedItemDetails && this.model.selectedItemDetails.selectedForEdit &&
          !this.model.selectedItemDetails.editContainerDefinition &&
          !this.model.selectedItemDetails.newContainerDefinition &&
          !this.model.selectedItemDetails.editNetwork &&
          !this.model.selectedItemDetails.editVolume &&
          !this.model.selectedItemDetails.addClosureView);
    },
    showClosureContextPanel: function() {
      return this.model.selectedItemDetails && this.model.selectedItemDetails.addClosureView;
    },
    areClosuresAllowed: function() {
      return ft.areClosuresAllowed();
    },
    isPartialResult: function() {
      return this.model.listView && this.model.listView.isPartialResult;
    },
    title: function() {
      if (this.selectedCategory === constants.TEMPLATES.SEARCH_CATEGORY.TEMPLATES) {
        return i18n.t('app.template.list.searchCategory.templates');
      } else if (this.selectedCategory === constants.TEMPLATES.SEARCH_CATEGORY.CLOSURES) {
        return i18n.t('app.template.list.searchCategory.closures');
      }
      return i18n.t('app.template.list.popularRepositories');
    },
    titleSearch: function() {
      if (this.selectedCategory === constants.TEMPLATES.SEARCH_CATEGORY.TEMPLATES) {
        return i18n.t('app.template.list.searchCategory.templates');
      } else if (this.selectedCategory === constants.TEMPLATES.SEARCH_CATEGORY.CLOSURES) {
        return i18n.t('app.template.list.searchCategory.closures');
      }
      return i18n.t('app.template.list.searchCategory.repositories');
    }
  },
  mixins: [GridHolderMixin],
  attached: function() {
    var $mainPanel = $(this.$el).children('.list-holder').children('.main-panel');

    $mainPanel.on('transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd',
      (e) => {
        if (e.target === $mainPanel[0]) {
          this.unsetPostTransitionGridTargetWidth();
        }
      }
    );

    this.unwatchExpanded = this.$watch('contextExpanded', () => {
      Vue.nextTick(() => {
        this.setPreTransitionGridTargetWidth($mainPanel);
      });
    });

    this.unwatchIsPartialResult = this.$watch('isPartialResult',
                                              (isPartialResult) => {
      if (isPartialResult) {
        var errorMessage = i18n.t('app.template.list.partialResultWarning');
        this.$dispatch('container-form-alert', errorMessage, constants.ALERTS.TYPE.WARNING);
      } else {
        this.$dispatch('container-form-alert', null);
      }
    });

    this.refreshRequestsInterval = setInterval(() => {
      if (this.activeContextItem === constants.CONTEXT_PANEL.REQUESTS) {
        RequestsActions.refreshRequests();
      }
    }, constants.REQUESTS.REFRESH_INTERVAL);

    this.notificationsInterval = setInterval(() => {
      if (!this.contextExpanded && !this.model.registries && utils.isContainersTabOpened()) {
        NotificationsActions.retrieveNotifications();
      }
    }, constants.NOTIFICATIONS.REFRESH_INTERVAL);
  },
  detached: function() {
    this.unwatchExpanded();
    this.unwatchIsPartialResult();

    var $mainPanel = $(this.$el).children('.list-holder').children('.main-panel');
    $mainPanel.off('transitionend MSTransitionEnd webkitTransitionEnd oTransitionEnd');

    clearInterval(this.refreshRequestsInterval);
    clearInterval(this.notificationsInterval);
  },
  components: {
    'container-image-item': {
      template: ListItemImageVue,
      props: {
        model: {
          required: true
        },
        groups: {
          required: false
        }
      },
      data: function() {
        return {
          readOnly: false
        };
      },
      methods: {
        provisionContainer: function($event) {
          $event.stopPropagation();
          $event.preventDefault();

          TemplateActions.createContainer(this.model.type, this.model.documentId);
        },
        provisionContainerAdditionalInfo: function($event) {
          $event.stopPropagation();
          $event.preventDefault();

          NavigationActions.openContainerRequest(this.model.type, this.model.documentId);
        }
      }
    },
    'container-template-item': {
      template: ListItemContainerVue,
      mixins: [DeleteConfirmationSupportMixin],
      props: {
        model: {
          required: true
        },
        groups: {
          required: false
        }
      },
      computed: {
        numberOfIcons: function() {
          return Math.min(this.model.icons && this.model.icons.length, 4);
        }
      },
      methods: {
        createTemplate: function($event) {
          // this does the provisioning of the Application
          $event.stopPropagation();
          $event.preventDefault();

          var template = {
            'documentSelfLink': this.model.documentSelfLink
          };

          TemplateActions.copyTemplate(this.model.type, template);
        },
        editTemplate: function($event) {
          $event.stopPropagation();
          $event.preventDefault();

          NavigationActions.openTemplateDetails(this.model.type, this.model.documentId);
        },
        removeTemplateDefinition: function() {
          this.confirmRemoval(TemplateActions.removeTemplate, [this.model.documentId]);
        },
        publishTemplateToCatalog: function($event) {
          $event.stopPropagation();
          $event.preventDefault();

          TemplateActions.publishTemplate(this.model.documentId);
        },
        exportTemplate: function($event) {
          $event.stopPropagation();
          $event.preventDefault();

          this.$dispatch('export-template', this.model.documentId);
        },
        operationSupported: function(op) {
          return utils.operationSupportedTemplate(op);
        }
      }
    },
    'closure-template-item': {
      template: ListItemClosureVue,
      mixins: [DeleteConfirmationSupportMixin],
      props: {
        model: {
          required: true
        },
        groups: {
          required: false
        }
      },
      computed: {
        numberOfIcons: function() {
          return Math.min(this.model.icons && this.model.icons.length, 4);
        },
        closureIcon: function() {
          return utils.getClosureIcon(this.model.runtime);
        },
        closureRuntime: function() {
          return utils.getClosureRuntimeName(this.model.runtime);
        }
      },
      methods: {
        handleBackButton: function(e) {
          if (e) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }

          var data = this.model || {};
          if (data.addClosureView) {
            TemplateActions.cancelAddClosure(this.model.documentId);
            return true;
          }

          return false;
        },
        createTemplate: function($event) {
          // this does the provisioning of the Application
          $event.stopPropagation();
          $event.preventDefault();

          var template = {
            'documentSelfLink': this.model.documentSelfLink
          };

          TemplateActions.copyTemplate(this.model.type, template);
        },
        editClosureDescription: function($event) {
          if ($event != null) {
            $event.stopImmediatePropagation();
            $event.preventDefault();
          }

          TemplateActions.openAddClosure(this.model);
        },
        removeClosureDescription: function($event) {
          if ($event != null) {
            $event.stopImmediatePropagation();
            $event.preventDefault();
          }

          TemplateActions.removeClosure(this.model);
        },
        runClosure: function($event) {
          $event.stopPropagation();
          $event.preventDefault();

          TemplateActions.openAddClosure(this.model);
          TemplateActions.runClosure(null, this.model, this.model.inputs);
          TemplatesContextToolbarActions.openToolbarClosureResults();
        },
        operationSupported: function(op) {
          return utils.operationSupportedTemplate(op);
        }
      }
    }
  },
  methods: {
    isApplicationEmbedded: function() {
      return utils.isApplicationEmbedded();
    },

    goBack: function() {
      // create template
      if (this.model.selectedItemDetails && this.model.selectedItemDetails.selectedForCreate) {

        if (this.model.selectedItemDetails.origin === 'templates') {
          return NavigationActions.openTemplates({
            $category: constants.TEMPLATES.SEARCH_CATEGORY.TEMPLATES
          }, true);
        } else if (this.model.selectedItemDetails.origin === 'applications') {
          return NavigationActions.openContainers({
            $category: constants.CONTAINERS.SEARCH_CATEGORY.APPLICATIONS
          }, true);
        }
      }

      if (this.model.selectedItemDetails && this.model.selectedItemDetails.selectedForEdit) {
        return NavigationActions.openTemplates({
          $category: constants.TEMPLATES.SEARCH_CATEGORY.TEMPLATES
        }, true);
      }

      let detailsView = this.$refs.templateDetails;
      if (!detailsView || !detailsView.handleBackButton || !detailsView.handleBackButton()) {
        // Current view cannot handle back button, we will make the navigation
        return NavigationActions.openTemplates(this.queryOptions, true);
      }
    },

    search: function(queryOptions) {
      this.doSearchAndFilter(queryOptions, this.selectedCategory);
    },

    selectCategory(categoryName, $event) {
      this.doSearchAndFilter(this.queryOptions, categoryName);
      $event.stopPropagation();
      $event.preventDefault();
    },

    doSearchAndFilter: function(queryOptions, categoryName) {
      var queryOptionsToSend = $.extend({}, queryOptions);
      queryOptionsToSend[constants.SEARCH_CATEGORY_PARAM] = categoryName;
      NavigationActions.openTemplates(queryOptionsToSend);
    },

    refresh: function() {
      TemplateActions.openTemplates(this.queryOptions, true);
    },

    openCreateTemplate: function($event) {
      $event.stopPropagation();
      $event.preventDefault();

      this.createTemplateName = null;

      TemplateActions.openCreateNewTemplate('templates');
    },

    createNewTemplate: function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      TemplateActions.createNewTemplate(this.createTemplateName);
    },

    editClosureDescription: function(e) {
      TemplateActions.openAddClosure(e.model);
    },

    removeClosure: function(e) {
      TemplateActions.removeClosure(e.model);
    },

    openToolbarRequests: TemplatesContextToolbarActions.openToolbarRequests,
    openToolbarEventLogs: TemplatesContextToolbarActions.openToolbarEventLogs,
    openToolbarDeploymentPolicies: HostContextToolbarActions.openToolbarDeploymentPolicies,
    closeToolbar: TemplatesContextToolbarActions.closeToolbar,
    openToolbarClosureResults: TemplatesContextToolbarActions.openToolbarClosureResults,

    alertType: function(alert) {
      return alert && alert.type;
    },
    alertClosed: function() {
      this.alert.show = false;
      this.alert.message = '';
    },

    exportTemplate: function(templateDocumentId) {
      this.showTemplateExport = true;
      this.exportTemplateDocumentId = templateDocumentId;
    },
    getExportLink: function(format) {
      return utils.getExportLinkForTemplate(this.exportTemplateDocumentId, format);
    },
    getExportLinkYaml: function() {
      return this.getExportLink(constants.TEMPLATES.EXPORT_FORMAT.COMPOSITE_BLUEPRINT);
    },
    getExportLinkDocker: function() {
      return this.getExportLink(constants.TEMPLATES.EXPORT_FORMAT.DOCKER_COMPOSE);
    },

    cancelExportTemplate: function() {
      this.showTemplateExport = false;
      this.exportTemplateDocumentId = null;
    }
  },
  events: {
    'container-form-alert': function(alertMessage, type) {
      if (alertMessage) {
        this.alert.show = true;
        this.alert.message = alertMessage;
        this.alert.type = type ? type : constants.ALERTS.TYPE.FAIL;
      } else {
        this.alert.show = false;
        this.alert.message = '';
      }
    },

    'export-template': function(templateDocumentId) {
      return this.exportTemplate(templateDocumentId);
    },

    'confirm-template-export': function() {
      this.showTemplateExport = false;
      this.exportTemplateDocumentId = null;
    }
  }
});

const TAG_NAME = 'templates-view';
Vue.component(TAG_NAME, TemplatesViewVueComponent);

function TemplatesView($el) {
  return new VueAdapter($el, TAG_NAME);
}


export default TemplatesView;
