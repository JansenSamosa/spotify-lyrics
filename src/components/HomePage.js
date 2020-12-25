import React, { Component } from 'react'

import './css/homepage.css'
import spotifylogo from '../icons/spotify.png'

export class HomePage extends Component {
    render() {
        return (
            <div className='home'>
                <div className='info'>
                    <h1> Spotify Lyrics</h1>
                    <p className='desc'> What is Spotify Lyrics? Well, its pretty simple. Spotify Lyrics is an app which syncs with your 
                        spotify account and displays lyrics in realtime for you. Start by logging in with Spotify!
                    </p>
                    <p className="btntag">Login with: </p>
                    <button className="loginbtn" onClick={this.props.login}>
                        <img src={spotifylogo} alt=''></img>
                    </button>
                </div>
            </div>
        )
    }
}

export default HomePage
