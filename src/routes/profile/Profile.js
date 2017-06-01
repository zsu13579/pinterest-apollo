/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './Profile.css';
import { graphql, compose } from 'react-apollo';
import { connect } from 'react-redux';
import FileUpload from 'react-fileupload';
import { FormGroup, Button,ControlLabel,HelpBlock,FormControl  } from 'react-bootstrap'
import Upload from 'rc-upload';

class Profile extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      imgAvatar: "default.png"
    };
	this.handleUpload = this.handleUpload.bind(this)
  }

  static propTypes = {
    title: PropTypes.string.isRequired,
  };

  handleUpload = (filename) =>{
    console.log(filename);
    this.setState({imgAvatar: filename });
  }

  render() {
		
    const uploaderProps = {
      action: '/profile',
      name: 'avatar',
      multiple: true,
      supportServerRender: true,
      onSuccess: (file) => {
		this.handleUpload(file.filename)        
      },
    };
	
    return (
      <div className={s.root}>
        <div className={s.container}>
          <h1>{this.props.title} <Upload {...uploaderProps} ref="inner" className={s.avatarEdit} ><a>更新头像</a></Upload></h1>
          <img src={this.state.imgAvatar} />
          <h3>User : {this.props.username}</h3>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  if (state.user){
    return {username: state.user.email}
  }
  return {}
}

const withData = graphql(profileQuery,{
	options: (ownProps) => ({ variables: { username: ownProps.username } }),
	props: ({data: { loading, profile }}) => ({ loading, profile || { imgAvatar: 'default.png' } )
})

const withMutations = graphql(profileMutation,{
	props: ({ ownProps,mutate }) => ({
		uploadAvatar: ({ owner, imgAvatar }) => 
			mutate({
				variables: { owner, imgAvatar },
				update: ( store, { data: profile}) => {
					// Read the data from our cache for this query.
					const data = store.readQuery({ query: profileQuery, variables: { username:owner } });
					// Add our comment from the mutation to the end.
					data.profile.imgAvatar = imgAvatar; 			
					// Write our data back to the cache.
					store.writeQuery({ query: profileQuery,variables: { username:owner }, data });					
				}
			})
	})
})

export default compose(
  withStyles(s),
  connect(mapStateToProps),
  withData,
  withMutations,
  )(Profile);
