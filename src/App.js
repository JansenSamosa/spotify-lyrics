import React, { Component } from 'react'
import { HashRouter as Router, Switch, Route, Link, NavLink, Redirect } from 'react-router-dom'
import axios from 'axios'

import HomePage from './components/HomePage'

import './App.css';
import logout from './icons/logout.png'

import Music from './components/Music'

export class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            authenticated: false
        }
    }

    componentDidMount() {
        this.getAndCheckToken()
    }
    //Checks if token is still valid, and if not, then get new token via refresh token. If refresh token does not work either, go back to login page
    getAndCheckToken = () => {
        //Checks if access token exists
        if(localStorage.getItem('access_token') != null) {
            let token = localStorage.getItem('access_token')
            //Checks if token still valid
            axios.get(`http://127.0.0.1:5000/api/v1/playing?token=${token}`)
                .then(res => {
                    //If still valid then the user is authenticated
                    this.setState({...this.state, authenticated: true})
                })
                .catch(error => {
                    //If not valid, get a new token via refresh
                    let refresh_token = localStorage.getItem('refresh_token')
                    this.getTokenByRefresh(refresh_token)
                })
        } else {
            //If token doesnt exist then get token via code
            let code = window.location.search.slice(6)
            this.getTokenByCode(code)
        }
    }
    getTokenByCode = code => {
        axios.post(`http://127.0.0.1:5000/api/v1/auth/token/code?code=${code}`)
            .then(res => {
                console.log(res.data)
                localStorage.setItem('access_token', res.data['access_token'])
                localStorage.setItem('refresh_token', res.data['refresh_token'])
                this.getAndCheckToken()
            })
            .catch(error => {
                if(window.location.href != "https://jansensamosa.github.io/spotify-lyrics/") {
                    window.location.href = "https://jansensamosa.github.io/spotify-lyrics/"
                }
            })
    }
    getTokenByRefresh = refresh_token => {
        axios.post(`http://127.0.0.1:5000/api/v1/auth/token/refresh?refresh_token=${refresh_token}`)
            .then(res => {
                console.log(res.data)
                localStorage.setItem('access_token', res.data['access_token'])
                this.getAndCheckToken()
            })
            .catch(error => {
                if(window.location.href != "https://jansensamosa.github.io/spotify-lyrics/") {
                    window.location.href = "https://jansensamosa.github.io/spotify-lyrics/"
                }
            })
    }
    login = () => {
        localStorage.clear()
        this.setState({...this.state, authenticated: false})
        axios.get('http://127.0.0.1:5000/api/v1/auth/login')
            .then(res => {
                let url = res.data
                window.location.href = url
            })
            .catch(error => console.log(error))
    }

    logout = () => {
        localStorage.clear()
        this.setState({...this.state, authenticated: false})
        window.location.href = "https://jansensamosa.github.io/spotify-lyrics/"
    }

    renderLogout = () => {
        return <button className="logoutbtn" onClick={this.logout}>
            <img src={logout}></img>
        </button>
    }
    redirect = () => {
        if(this.state.authenticated) {
            return <Redirect to='/music'></Redirect>
        } else {
            return null
        }
    }

    render() {
        return (
            <Router basename=''>
                <div className='App'>
                    {this.redirect()}
                    <Switch>            
                        <Route path = '/music' component={Music}>
                            <Music getAndCheckToken={() => this.getAndCheckToken()}/>
                            {this.renderLogout()}
                        </Route>
                        <Route path = '/'>
                            <HomePage login={this.login.bind()}></HomePage>
                        </Route>
                    </Switch>
                </div>
            </Router>
        )
    }
}

export default App
