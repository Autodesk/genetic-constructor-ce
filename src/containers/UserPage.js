import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { loadUser, loadStarred } from '../actions';
import User from '../components/User';
import Repo from '../components/Repo';
import List from '../components/List';

function loadData(props) {
  const { login } = props;
  props.loadUser(login, ['name']);
  props.loadStarred(login);
}

class UserPage extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    login: PropTypes.string.isRequired,
    user: PropTypes.object,
    starredPagination: PropTypes.object,
    starredRepos: PropTypes.array.isRequired,
    starredRepoOwners: PropTypes.array.isRequired,
    loadUser: PropTypes.func.isRequired,
    loadStarred: PropTypes.func.isRequired
  }

  componentWillMount() {
    loadData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.login !== this.props.login) {
      loadData(nextProps);
    }
  }

  handleLoadMoreClick = () => {
    this.props.loadStarred(this.props.login, true);
  }

  renderRepo = ([repo, owner]) => {
    return (
      <Repo repo={repo}
            owner={owner}
            key={repo.fullName} />
    );
  }

  render() {
    const { user, login } = this.props;
    if (!user) {
      return <h1><i>Loading {login}’s profile...</i></h1>;
    }

    const { starredRepos, starredRepoOwners, starredPagination } = this.props;

    //e.g. demonstration of sourcemapping
    console.log(starredRepoOwners);

    let items = starredRepos.reduce((zipped, next, index) => {
      zipped.push([next, starredRepoOwners[index]]);
      return zipped;
    }, []);

    return (
      <div>
        <User user={user} />
        <hr />
        <List renderItem={this.renderRepo}
              items={items}
              onLoadMoreClick={this.handleLoadMoreClick}
              loadingLabel={`Loading ${login}’s starred...`}
              {...starredPagination} />
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { login } = state.router.params;
  const {
    pagination: { starredByUser },
    entities: { users, repos }
  } = state;

  const starredPagination = starredByUser[login] || { ids: [] };
  const starredRepos = starredPagination.ids.map(id => repos[id]);
  const starredRepoOwners = starredRepos.map(repo => users[repo.owner]);

  return {
    login,
    starredRepos,
    starredRepoOwners,
    starredPagination,
    user: users[login]
  };
}

export default connect(mapStateToProps, {
  loadUser,
  loadStarred
})(UserPage);
