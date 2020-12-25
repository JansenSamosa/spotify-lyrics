import React, { Component } from 'react'

import music from './css/music.css'
import musicmobile from './css/musicmobile.css'

import axios from 'axios'
import {Palette} from 'react-palette'
import Color from 'color'

import pause from '../icons/pause.png'
import play from '../icons/play.png'
import skiptrack from '../icons/skip-track.png'

export class Music extends Component {
    constructor(props) {
        super(props)

        this.lyricsRef = React.createRef()
        this.progressBarRef = React.createRef()
        this.progressBarFilledRef = React.createRef()
        this.state = {
            lyrics: ["No Music Playing"],
            artists: ["No Music Playing..."],
            song_title: "No Music Playing..",
            song_duration: 9999999,
            album_img_url: "",
            is_playing: false
        }
        this.song_progress = 0
    }
    componentDidMount() {
        this.getPlaying()
        
        //Get the current playing song each second
        this.refreshInterval = setInterval(() => this.getPlaying(), 3500)

        //Update current duration of song every 50ms
        this.durationInterval = setInterval(() => {
            this.progressBarRef.current.value = this.song_progress
            this.progressBarFilledRef.current.style.width = `${window.innerWidth * (this.song_progress / this.state.song_duration)}px`

            if(this.state.is_playing) {
                //If this song isnt finished, update progress
                if(this.song_progress < this.state.song_duration) {
                    this.song_progress += 25

                    let songPercent = this.song_progress / this.state.song_duration
                    
                    //Scroll the lyrics to look at current lyrics
                    let newScrollTop = (this.lyricsRef.current.scrollHeight * songPercent) - (window.innerHeight*.75)/2
                    if(Math.abs(newScrollTop - this.lyricsRef.current.scrollTop) > 25/this.state.song_duration * this.lyricsRef.current.scrollHeight) {
                        this.lyricsRef.current.scrollTo({
                            top: newScrollTop,
                            left: 0,
                        })              
                    } else {
                        this.lyricsRef.current.scrollTo({
                            top: newScrollTop,
                            left: 0,
                            behavior: 'smooth'
                        })
                    }   
                } else {
                    //else, get new song
                    this.getPlaying()
                }    
            }    
        }, 25)
    }

    componentWillUnmount() {
        clearInterval(this.refreshInterval)
        clearInterval(this.durationInterval)
    }

    //Get lyrics to current song and sets the state to it
    getPlayingLyrics = () => {
        this.setState({...this.state, lyrics: ["Loading..."]})
        axios.get('https://spotify-lyrics-api.herokuapp.com/api/v1/playing/lyrics', { params: {token: localStorage.getItem('access_token')}})
            .then(res => {
                this.setState({...this.state, lyrics: res.data})
            })
            .catch(error => console.log(error))
    }
    //Gets the current song playing, but not the lyrics
    getPlaying = () => {    
        //Get data  
        axios.get('https://spotify-lyrics-api.herokuapp.com/api/v1/playing', { params: {token: localStorage.getItem('access_token')}})
            .then(res => {
                if(res.status === 200) {
                    //Extracts the important info from data
                    let artists = res.data['item']['artists'].map(artist => artist["name"])
                    let song_title = res.data['item']['name']
                    let song_duration = res.data['item']['duration_ms']
                    let song_progress = res.data['progress_ms']
                    let album_img_url = res.data['item']['album']['images'][0]['url']
                    let is_playing = res.data['is_playing']
                    console.log(res.data)

                    //Also gets the lyrics, if we found a different song playing
                    if(artists !== this.state.artists && song_title !== this.state.song_title) {
                        this.getPlayingLyrics()
                    }
                    
                    //Sets values to the info extracted from data
                    this.setState({...this.state, 
                        artists: artists, 
                        song_title: song_title,
                        song_duration: song_duration,
                        song_progress: song_progress,
                        album_img_url: album_img_url,
                        is_playing: is_playing
                    })
                    this.song_progress = song_progress
                } 
                else if(res.status === 204) {
                    this.song_progress = 0
                    this.setState({...this.state, 
                        lyrics: ["No Music Playing"],
                        artists: ["No Music Playing..."],
                        song_title: "No Music Playing..",
                        song_duration: 9999999,
                        album_img_url: "",
                        is_playing: false
                    })
                }
            })
            .catch(error => {
                //If error, reauthenticate the user
                this.props.getAndCheckToken()
                console.log(error)
            })
    }

    skipTrack = (type) => {
        axios.get(`https://spotify-lyrics-api.herokuapp.com/api/v1/user/profile?token=${localStorage.getItem('access_token')}`)
            .then(res => {
                if(res.data['product'] === 'premium') {
                    this.song_progress = 0
                    this.setState({...this.state, 
                        lyrics: ["Loading Lyrics"],
                        artists: ["Loading..."],
                        song_title: "Loading..",
                        song_duration: 9999999,
                        album_img_url: "",
                    })

                    if (type == "next"|| type == "previous") {
                        axios.post(`https://spotify-lyrics-api.herokuapp.com/api/v1/playing/skip/${type}?token=${localStorage.getItem('access_token')}`)
                            .then(res => {
                                setTimeout(() => {
                                    this.getPlaying()
                                }, 500)
                            }) .catch(error => {
                                this.props.getAndCheckToken()
                                console.log(error)
                            })
                    }    
                } else {
                    window.alert("Sorry! This feature is only available to spotify premium users!")
                }
            })
            .catch(error => {
                this.props.getAndCheckToken()
                console.log(error)
            })
    }

    pauseTrack = () => {
        axios.get(`https://spotify-lyrics-api.herokuapp.com/api/v1/user/profile?token=${localStorage.getItem('access_token')}`)
            .then(res => {
                console.log(res.data)
                if(res.data['product'] === 'premium') {
                    let type = "pause"
                    if(!this.state.is_playing) {
                        type = "unpause"
                        this.setState({...this.state, is_playing: true})
                    } else {
                        this.setState({...this.state, is_playing: false})
                    }

                    axios.put(`https://spotify-lyrics-api.herokuapp.com/api/v1/playing/${type}?token=${localStorage.getItem('access_token')}`)
                        .then(res => {
                            this.getPlaying()
                        }) .catch(error => {
                            this.props.getAndCheckToken()
                            console.log(error)
                        })
                } else {
                    window.alert("Sorry! This feature is only available to spotify premium users!")
                }
            })
            .catch(error => {
                this.props.getAndCheckToken()
                console.log(error)
            })
    }

    //Renders each line of the song individually
    renderLine = line => {
        if(line.includes("[")) {
            return (
                <p className='bold' style={{lineHeight: '20px'}}>{line.replace('[', '').replace(']', '')}</p>
            )
        } else {
            return (
                <p>{line}</p>
            )
        }
    }

    renderArtists = () => {
        let str = this.state.artists[0]

        this.state.artists.forEach((a, index) => {
            if (index != 0) {
                str += `, ${a}`
            }
        })
        return str
    }
    renderPauseIcon = () => {
        let is_playing = this.state.is_playing
        console.log(is_playing)
        if(is_playing) {
            return <img src={pause}></img>
        } else {
            return <img src={play}></img>
        }
    }
    render() {
        return (
            <div>
                <Palette src={this.state.album_img_url}>
                    {({ data, loading, error }) => (
                        <div>
                            <div className='lyrics' 
                                ref={this.lyricsRef} 
                                style={{/*backgroundColor: Color(data.muted).lighten(.9).hex().toString(), 
                                color:Color(data.darkVibrant).saturate(1).darken(.6).hex().toString()*/}} 
                            >
                                    {this.state.lyrics.map(line => this.renderLine(line))}
                            </div> 
                            <div className="song_info" style={{/*backgroundColor:Color(data.muted).whiten(.2).lighten(.7).hex().toString(),
                                                                color:Color(data.darkVibrant).saturate(1).darken(.6).hex().toString()*/}}
                            >
                                <div className="song-info-container">
                                    
                                    <img className="album_img" src={this.state.album_img_url}></img>
                                    <div className="song-info-container2">
                                        <p className="song_title bold">{this.state.song_title}</p>                       
                                        <p className="artists">{this.renderArtists()}</p>
                                    </div>
                                </div>
                                
                                <div className="music-player">
                                    <button className="skipnextbtn" onClick={() => this.skipTrack("next")}> <img src={skiptrack}></img> </button>
                                    <button className="skippreviousbtn" onClick={() => this.skipTrack("previous")}> <img src={skiptrack}></img> </button>
                                    <button className="pausebtn" onClick={() => this.pauseTrack()}>{this.renderPauseIcon()}</button>
                                    <input className="progress-bar" ref={this.progressBarRef} type="range" min="0" max={this.state.song_duration} value={this.song_progress}></input>
                                    <div className="progress-bar-filled" ref={this.progressBarFilledRef} style={{width: `${window.innerWidth * (this.song_progress / this.state.song_duration)}px`}}></div>
                                </div>
                                
                            </div>
                        </div>
                    )}
                    
                </Palette> 
            </div>
        )
    }
}

export default Music

/*<button className="skipnextbtn" onClick={() => this.skipTrack("next")}> <img src={skiptrack}></img> </button>
                                <button className="skippreviousbtn" onClick={() => this.skipTrack("previous")}> <img src={skiptrack}></img> </button>
                                <button className="pausebtn" onClick={() => this.pauseTrack()}>{this.renderPauseIcon()}</button>

                                <input className="progress-bar" ref={this.progressBarRef} type="range" min="0" max={this.state.song_duration} value={this.song_progress}></input>
                                <div className="progress-bar-filled" ref={this.progressBarFilledRef} style={{width: `${window.innerWidth * (this.song_progress / this.state.song_duration)}px`}}></div>
*/