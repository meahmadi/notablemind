var React = require('react')
  , {Navigation, State} = require('react-router')

  , KeyManager = require('treed/key-manager')
  , keys = require('treed/lib/keys')
  , files = require('../files')
  , gists = require('../gists')

  , GistForm = require('../components/gist-form')
  , DocViewer = require('../components/doc-viewer')

var GistPage = React.createClass({
  mixins: [Navigation, State],

  componentDidMount: function () {
    if (this.getParams().id) this.loadFile()
    window.addEventListener('keydown', this._keyDown)
  },

  componentWillUnmount: function () {
    window.removeEventListener('keydown', this._keyDown)
  },

  componentWillReceiveProps: function (nextProps) {
    var params = this.getParams()
    if (params.uid + '/' + params.id !== this.state.loadedGist) {
      this.loadFile()
    }
  },

  getInitialState: function () {
    return {
      loadedGist: null,
      loading: !!this.getParams().id,
      error: null,
    }
  },

  _keyDown: function (e) {
    if (!this.state.keys) return
    if (this.state.store.views[this.state.store.activeView].mode !== 'insert' &&
        ['INPUT', 'TEXTAREA'].indexOf(e.target.nodeName) !== -1) {
      return
    }
    return this.state.keys.keyDown(e)
  },

  loadFile: function () {
    this.setState({error: null, loading: true, loadedGist: null})
    var uid = this.getParams().uid
    var id = this.getParams().id

    gists.load(uid, id, (err, file, store, plugins) => {
      if (err) return this.setState({error: err, loading: false})
      window.store = store
      window.docPage = this

      var keys = new KeyManager()
      keys.attach(store)
      keys.addKeys({
        'g q': () => this.transitionTo('browse'),
      })

      this.setState({
        keys,
        file,
        store,
        plugins,
        loadedGist: uid + '/' + id,
        loading: false,
      })
    })
  },

  goToGist: function (gid) {
    var parts = gid.split('/')
    if (parts.length !== 2) return console.warn('tried to load an invalid gist id: ' + gid)
    this.transitionTo('gist', {uid: parts[0], id: parts[1]})
  },

  render: function () {
    if (this.state.loading) {
      return <div className='GistPage GistPage-loading'>Loading</div>
    }
    if (this.state.error) {
      return <div className='GistPage GistPage-error'>Error loading gist: {this.state.error + ''}</div>
    }
    if (!this.state.file) {
      return <div className='GistPage'>
        <GistForm onSubmit={this.goToGist}/>
      </div>
    }

    var {store, file, plugins} = this.state

    return <div className='GistPage'>
      <GistForm initialValue={this.state.loadedGist} onSubmit={this.goToGist}/>
      <DocViewer
        file={file}
        store={store}
        plugins={plugins}
        query={this.getQuery()}
        saveWindowConfig={(config, done) => done()}
        keys={this.state.keys}/>
    </div>
  },
})

module.exports = GistPage
