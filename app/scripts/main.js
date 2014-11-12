/*global Backbone, _, $, Firebase*/

'use strict';

$(function() {

  var firebase = window.firebase = new Firebase('https://jobs-on-fire.firebaseio.com/');

  firebase.onAuth(function(authData) {
    if (authData) {
      $('.logout').removeClass('hide');
    } else {
      $('.logout').addClass('hide');
    }
  });

  /* Backbone forms customization */
  Backbone.Form.template = _.template('<form class="form-horizontal" role="form" data-fieldsets></form>');
  Backbone.Form.Fieldset.template = _.template('<fieldset data-fields><% if (legend) { %><legend><%= legend %></legend><% } %></fieldset>');
  Backbone.Form.Field.template = _.template('<div class="form-group field-<%= key %>"><label class="col-sm-2 control-label" for="<%= editorId %>"><%= title %></label><div class="col-sm-10"><span data-editor></span><p class="help-block" data-error></p><p class="help-block"><%= help %></p></div></div>');
  Backbone.Form.NestedField.template = _.template('<div class="field-<%= key %>"><div title="<%= title %>" class="input-xlarge"><span data-editor></span><div class="help-inline" data-error></div></div><div class="help-block"><%= help %></div></div>');
  Backbone.Form.editors.Base.prototype.className = 'form-control';
  Backbone.Form.editors.Radio.prototype.className = 'radio';
  Backbone.Form.editors.Checkbox.prototype.className = 'checkbox';
  Backbone.Form.Field.errorClassName = 'has-error';
  Backbone.Form.validators.errMessages.required = 'Obligatorio';
  Backbone.Form.validators.errMessages.email = 'Debe indicar un correo electrónico válido';
  /* End of Backbone Forms customization */

  var JobSchema = {
    title: {
      title: 'Título de la Oferta',
      type: 'Text',
      validators: ['required']
    },
    expires: {
      title: 'Fecha de Expiración',
      type: 'Date',
      validators: ['required']
    },
    location: {
      title: 'Ubicación',
      type: 'Text',
      validators: [
        function(value, formValues) {
          if (!formValues.remote && !value) {
            return {
              type: 'location',
              message: 'Debes indicar una ubicación si el empleo no es remoto'
            };
          } else {
            return null;
          }
        }
      ]
    },
    remote: {
      title: 'Remoto?',
      type: 'Checkbox'
    },
    workingTime: {
      title: 'Horario de Trabajo',
      type: 'Radio',
      options: [
        'A convenir',
        'Medio Tiempo',
        'Tiempo Completo'
      ]
    },
    description: {
      title: 'Descripción',
      type: 'TextArea',
      validators: [
        'required',
        function(value) {
          if (value.length < 140) {
            return {
              type: 'description',
              message: 'La descripción es muy corta. Debe ser de 140 caracteres o más.'
            };
          } else {
            return null;
          }
        }
      ]
    },
    publisher: {
      title: 'Publicado por',
      type: 'Text',
      validators: ['required']
    },
    email: {
      title: 'Correo de contacto',
      type: 'Text',
      dataType: 'email',
      validators: [
        'email',
        function(value, formValues) {
          if (!value && !formValues.url) {
            return {
              type: 'email',
              message: 'Es necesario un correo electrónico o una URL de aplicación'
            };
          } else {
            return null;
          }
        }
      ]
    },
    url: {
      title: 'URL de aplicación',
      type: 'Text',
      dataType: 'url',
      validators: [
        function(value, formValues) {
          if (!value && !formValues.email) {
            return {
              type: 'url',
              message: 'Es necesario un correo electrónico o una URL de aplicación'
            };
          } else {
            return null;
          }
        }
      ]
    }
  };

  var JobDefaults = {
    posted: Date.now().valueOf(),
    updated: Date.now().valueOf(),
    expires: Date.now().valueOf() + 1296015000, // now plus 15 days and 1 sec
    remote: false,
    workingTime: 'A convenir'
  };

  var Job = Backbone.Model.extend({
    defaults: JobDefaults
  });

  var Jobs = Backbone.Firebase.Collection.extend({
    model: Job,
    firebase: firebase.child('jobs')
  });

  var JobView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#job_template').text()),
    initialize: function() {
      this.listenTo(this.model, 'change', this.render);
    },
    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });


  var LoginOrRegisterView = Backbone.View.extend({
    el: $('#login_or_register_body'),
    events: {
      'click #login_or_register_fb': 'fbLogin',
      'click #login_or_register_tw': 'twLogin',
      'click #login_or_register_gh': 'ghLogin',
      'click #login_or_register_go': 'goLogin'
    },
    initialize: function() {
      this.users = firebase.child('users');
    },
    genericLogin: function(err, authData) {
      if (!err) {
        this.users.child(authData.uid).set(authData);
        $('#login_or_register_modal').modal('hide');
      } else {
        this.$el.prepend('<p class="text-danger">No se pudo ingresar</p>');
        firebase.child('errors').push(err);
      }
    },
    fbLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('facebook', _.bind(this.genericLogin, this));
    },
    twLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('twitter', _.bind(this.genericLogin, this));
    },
    ghLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('github', _.bind(this.genericLogin, this));
    },
    goLogin: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.users.authWithOAuthPopup('google', _.bind(this.genericLogin, this));
    }
  });

  var AddJobView = Backbone.View.extend({
    el: $('#add_job_content'),
    events: {
      'click #add_job_button': 'addJob'
    },
    initialize: function(pars) {
      this.jobs = pars.jobs;
    },
    render: function() {
      this.form = new Backbone.Form({
        schema: JobSchema,
        data: JobDefaults
      });
      this.$('.add-job-form').html(this.form.render().el);
    },
    addJob: function() {
      var jobData;
      if (!this.form.validate()) {
        jobData = this.form.getValue();
        this.jobs.create(_.extend(jobData, {
          userId: this.jobs.firebase.getAuth().uid
        }));
        $('#add_job_modal').modal('hide');
      }
    }
  });


  var JobsView = Backbone.View.extend({
    el: $('#jobs_on_fire'),
    events: {
      'click #add_job': 'addJobDialog',
      'click #logout_link': 'logout'
    },
    initialize: function(pars) {
      this.jobs = pars.jobs;
      this.list = this.$('#jobs .jobs-list');
      this.listenTo(this.jobs, 'add', this.addOne);
      this.listenTo(this.jobs, 'remove', this.removeOne);
    },
    addOne: function(job) {
      var view = new JobView({model: job});
      this.list.append(view.render().el);
    },
    removeOne: function(obj) {
      this.$('#job_' + obj.id).remove();
    },
    addJobDialog: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      var authData = this.jobs.firebase.getAuth();
      if (authData) {
        new AddJobView({jobs: this.jobs}).render();
        this.$('#add_job_modal').modal();
      } else {
        new LoginOrRegisterView({firebase: this.jobs.firebase}).render();
        this.$('#login_or_register_modal').modal();
      }
    },
    logout: function(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      this.jobs.firebase.unauth();
    }
  });

  var jobs = new Jobs();
  new JobsView({jobs: jobs});
});
