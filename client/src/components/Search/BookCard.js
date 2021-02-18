import React, { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import amazon from '../../images/amazon_logo.png';
import bookshop from '../../images/bookshop_logo.png';
import wikipedia from '../../images/wikipedia.png';
import './BookCard.scss';

const BookCard = (props) => {
  const { user, isAuthenticated, isLoading } = useAuth0(); 
  const { loginWithRedirect } = useAuth0();

  const renderChecks = async (sub, listType, id) => {
    //clear all checkboxes
    const boxes = document.getElementsByClassName(listType);
    for (let i = 0; i < boxes.length; i++){
      boxes[i].checked = false;
    }
    //check if user has item in listType
    const check = await fetch(`/api/booklists/${listType}/${sub}/${id}`);
    const checkText = await check.text();
    //if in listtype, check box
    if (checkText === listType) {
      const box = document.getElementsByClassName(listType);
      box[props.cardNumber].checked = true;
    }
  };

  const showAlert = () => {
    const login = () => loginWithRedirect();
    window.location.href = login();
  }

  const renderCounts = async(listType) => {
    //not in is authenticated block
    //get html elements
    const numbers = document.getElementsByClassName(listType + '-count');
    //get count
    const count = await fetch(`/api/count/${listType}/${props.google_id}`)
    const countText = await count.text();
    numbers[props.cardNumber].innerHTML = '(' + countText + ')';
  }

  const addRemoveBooklist = async (sub, id, listType, title, author, date, image, pages, words) => {
    const box = document.getElementsByClassName(listType);
    const numbers = document.getElementsByClassName(listType + '-count');
    let prevNumber = numbers[props.cardNumber].innerHTML;
    //if unchecked, add to list
    if (box[props.cardNumber].checked === true) {
      //first, do a fake count increase (so rendercounts does not have to be run again)
      prevNumber = parseInt(prevNumber[0, 1]);
      prevNumber++;
      prevNumber = '(' + prevNumber + ')';
      numbers[props.cardNumber].innerHTML = prevNumber;
      const date_added = Date();
      const seconds_added = Date.now();
      //create json
      const json = `{
        "auth0_id": "${sub}",
        "google_id": "${id}",
        "listtype": "${listType}",
        "title": "${title}",
        "author": "${author}",
        "date": "${date}",
        "image": "${image}",
        "pages": "${pages}",
        "words": "${words}",
        "date_added": "${date_added}",
        "seconds_added": "${seconds_added}"
      }`;
      //send to db
      const response = await fetch("/api/booklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json
      });
    };
    //if checked, remove from list
    if (box[props.cardNumber].checked === false) {
      //first, do a fake count decrease (so rendercounts does not have to be run again)
      prevNumber = parseInt(prevNumber[0, 1]);
      prevNumber--;
      prevNumber = '(' + prevNumber + ')';
      numbers[props.cardNumber].innerHTML = prevNumber;
      //step 2: get the date added from the entry (will be used in deletions table for timeline use)
      const previousAddedDate = await fetch(`/api/addeddate/${sub}/${props.google_id}/${listType}`);
      const previousAddedDateJson = await previousAddedDate.json();
      //step 3: get the seconds added from the entry (will be used in deletions table for sorting in timeline)
      const previousAddedSeconds = await fetch(`/api/addedseconds/${sub}/${props.google_id}/${listType}`);
      const previousAddedSecondsJson = await previousAddedSeconds.json();
      //send delete request
      const response = fetch(`/api/booklists/${sub}/${listType}/${id}`, {
        method: "DELETE"
      });
      //add to deletions table
      const date_added = Date();
      const seconds_added = Date.now();
      //create json
      const json = `{
        "auth0_id": "${sub}",
        "google_id": "${id}",
        "listtype": "${listType}",
        "title": "${title}",
        "author": "${author}",
        "date": "${date}",
        "image": "${image}",
        "pages": "${pages}",
        "words": "${words}",
        "date_added": "${date_added}",
        "type": "remove",
        "seconds_added": "${seconds_added}"
      }`;
      //send to db
      const response2 = await fetch("/api/deletions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json
      });
      //create json
      const json2 = `{
        "auth0_id": "${sub}",
        "google_id": "${id}",
        "listtype": "${listType}",
        "title": "${title}",
        "author": "${author}",
        "date": "${date}",
        "image": "${image}",
        "pages": "${pages}",
        "words": "${words}",
        "date_added": "${previousAddedDateJson}",
        "type": "add",
        "seconds_added": "${previousAddedSecondsJson}"
      }`;
      //send to db
      const response3 = await fetch("/api/deletions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json2
      });
    };
  }

  //create onclick functions for adding/removing list entries from db
  const addToTBR = () => addRemoveBooklist(user.sub, props.google_id, 'TBR', props.title, props.author, props.published, props.image, props.pages, props.words);
  const addToCURR = () => addRemoveBooklist(user.sub, props.google_id, 'CURR', props.title, props.author, props.published, props.image, props.pages, props.words);
  const addToARL = () => addRemoveBooklist(user.sub, props.google_id, 'ARL', props.title, props.author, props.published, props.image, props.pages, props.words);
  const addToDNF = () => addRemoveBooklist(user.sub, props.google_id, 'DNF', props.title, props.author, props.published, props.image, props.pages, props.words);

  //add/remove from db, else show sign up function
  const onCheckBoxClick = (listtype) => {
    if (isAuthenticated) {
      if (listtype === 'TBR') {
        addToTBR();
      } else if (listtype === 'CURR') {
        addToCURR();
      } else if (listtype === 'ARL') {
        addToARL();
      } else if (listtype === 'DNF') {
        addToDNF();
      }
    } else {
      showAlert();
    } 
  }

  const TBRonCheck = () => onCheckBoxClick('TBR');
  const CURRonCheck = () => onCheckBoxClick('CURR');
  const ARLonCheck = () => onCheckBoxClick('ARL');
  const DNFonCheck = () => onCheckBoxClick('DNF');

  //useEffect ensures that render checks and color enforcement are only run once
  useEffect(() => {
    renderCounts('TBR');
    renderCounts('CURR');
    renderCounts('ARL');
    renderCounts('DNF');
    if (isAuthenticated && !isLoading) {
      renderChecks(user.sub, 'TBR', props.google_id);
      renderChecks(user.sub, 'CURR', props.google_id);
      renderChecks(user.sub, 'ARL', props.google_id);
      renderChecks(user.sub, 'DNF', props.google_id);
  };
  }, [props.page])

  return (
    <div className="bookcard">
      <a href={props.google_link} target="_blank" rel="noreferrer"><img src={props.image} alt="" /></a>
      <div id="right-side">
        <div className="desc">
          <h1 id="card-title">{props.title}</h1>
          <i><h1 id="author">{props.author}</h1></i>
          <h1 id="date">{props.published}</h1>
        </div>
        <div className="action-buttons">
          <div className="description-container">
            <p className="add-description">Want</p>
            <p className="TBR-count">( )</p>
          </div>
          <div className="description-container">
            <p className="add-description">Reading</p>
            <p className="CURR-count">( )</p>
          </div>
          <div className="description-container">
            <p className="add-description">Read</p>
            <p className="ARL-count">( )</p>
          </div>
          <div className="description-container">
            <p className="add-description">DNF</p>
            <p className="DNF-count">( )</p>
          </div>
          <div className="checklist-container">
            <input type="checkbox" className="TBR" onClick={TBRonCheck}></input>
          </div>
          <div className="checklist-container">
            <input type="checkbox" className="CURR" onClick={CURRonCheck}></input>
          </div>
          <div className="checklist-container">
            <input type="checkbox" className="ARL" onClick={ARLonCheck}></input>
          </div>
          <div className="checklist-container">
            <input type="checkbox" className="DNF" onClick={DNFonCheck}></input>
          </div>
          <div className="external-container"><a href={props.wikipedia_link} target="_blank" rel="noreferrer"><img className="wikipedia-png" src={wikipedia} alt="amazon" /></a></div>
          <div className="external-container"><a href={props.amazon_link} target="_blank" rel="noreferrer"><img className="amazon-png" src={amazon} alt="amazon" /></a></div>
          <div className="external-container"><a href={props.bookshop_link} target="_blank" rel="noreferrer"><img className="bookshop-png" src={bookshop} alt="bookshop" /></a></div>
        </div>
      </div>
      
    </div>
  )

}

export default BookCard;