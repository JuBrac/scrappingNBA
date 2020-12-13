const puppeteer = require("puppeteer")
const fs = require('fs').promises

const getData = async() => {
    const browser  = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto("https://www.espn.com/nba/scoreboard/_/date/20200807")

    //var html = fs.readFileSync('response.txt','utf8');

    var html = await page.content()
    //console.log(html)
    await fs.writeFile('responsePuppeteer.txt',html,(err) => { 
      
        // In case of a error throw err. 
        if (err) console.log(err); 
    }) ;
    var html =await fs.readFile('responsePuppeteer.txt','utf8');

    //Récupération du string correspondant au score d'OKC
    var regexDebut = new RegExp('<span class="sb-team-short">Thunder</span>');
    var indiceDebutThunder = html.search(regexDebut);
    var regexFin = new RegExp('</tr>');
    var infoThunder = html.substring(indiceDebutThunder);
  
    var indiceFinThunder = infoThunder.search(regexFin);
    var infoMatchThunder = infoThunder.substring(0,indiceFinThunder);
    console.log(infoMatchThunder);

    browser.close()
}

const getDataOfAllTeams = async (url)=>{

    const browser  = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto(url)
    var pageContent = await page.content()


    var html = pageContent;
    browser.close();

    // var html =await fs.readFile('responsePuppeteer.txt','utf8');

    const cutString = (stringToCut,regexDebut,regexFin,tabString) =>{

        var indiceDebut = stringToCut.search(regexDebut);
        //console.log(indiceDebut);

        if(indiceDebut!=-1){
            var infoTeam = stringToCut.substring(indiceDebut);
            var indiceFin = infoTeam.search(regexFin);
            var infoMatchTeam = infoTeam.substring(0,indiceFin);
            //console.log(infoMatchTeam);

            tabString.push(infoMatchTeam);

            cutString(infoTeam.substring(indiceFin),regexDebut,regexFin,tabString);
        }
        //console.log(tabString);
        //return tabString;
    }
    var regexDebutTeamInfo = new RegExp('<span class="sb-team-short">');
    var regexFinTeamInfo = new RegExp('</tr>');
    var tabStringTeam = [];
    cutString(html,regexDebutTeamInfo,regexFinTeamInfo,tabStringTeam);


    var regexDebutPlayerInfo = new RegExp('<h1>Top Performers</h1>');
    var regexFinPlayerInfo = new RegExp('<!-- note runs under first three columns -->');
    var tabStringPlayer = [];
    cutString(html,regexDebutPlayerInfo,regexFinPlayerInfo,tabStringPlayer);

    var regexDebutTimeInfo = new RegExp('<div class="scoreboard-wrapper">');
    var regexFinTimeInfo = new RegExp('<tr class="away">');
    var tabStringTime = [];
    cutString(html,regexDebutTimeInfo,regexFinTimeInfo,tabStringTime);



    const getScoreFromString = (tabInfoString) => {
        var tabInfoTotal = [];
        for(let i=0;i<tabInfoString.length;i++){
            var regexpTeamName = new RegExp('<span class="sb-team-short">(.*)</span>');
            var teamName = tabInfoString[i].match(regexpTeamName)[1];

            var regexpTeamAbrev = new RegExp('<span class="sb-team-abbrev">(.*)</span>');//(.*) => extrait la chaine de caractères au milieu
            var teamAbrev =  tabInfoString[i].match(regexpTeamAbrev)[1];

            // var regexpOverallRecord = new RegExp('<p class="record overall">(.*)</p>');
            // var overallRecord = tabInfoString[i].match(regexpOverallRecord)[1];

            var regexpTotalPoints = new RegExp('<td class="total"><span>(.*)</span></td>');
            try{
                var totalPoints = tabInfoString[i].match(regexpTotalPoints)[1];
                var jsonTeam = {
                    name : teamName,
                    abrev : teamAbrev,
                    // overallRecord : overallRecord,
                    totalPoints : totalPoints
                }
            } catch(error){

                var totalPoints = 0
                var jsonTeam = {
                    name : teamName,
                    abrev : teamAbrev,
                    // overallRecord : overallRecord,
                    totalPoints : totalPoints
                }

            }
            
            //console.log(teamName,teamAbrev,overallRecord,totalPoints);


            tabInfoTotal.push(jsonTeam);
            //console.log(jsonTeam);
        }
        //console.log(tabInfoTotal);
        return tabInfoTotal;
           
    }

    const getScheduleFromString = (tabStringTime) => {
        tabSchedule = []
        for(let i=0;i<tabStringTime.length;i++){

            var regexpHoraire = new RegExp('span data-dateformat="time1" class="time">(.*)</span>')
            // console.log(tabTimeString[i])
            var horaireMatch = tabStringTime[i].match(regexpHoraire)[1];
    
            var regexpDate = new RegExp('<th class="date-time" data-behavior="date_time" data-date="(.*)">')
            var dateMatch = tabStringTime[i].match(regexpDate)[1];
    
            // console.log(horaireMatch,dateMatch)
            jsonSchedule = {
                date : dateMatch,
                horaire : horaireMatch
            }
            tabSchedule.push(jsonSchedule)
        }
        return tabSchedule;

    }

    const getTopPerformer = (stringPlayer) => {
        var tabPlayerTotal = [];
        for(let i=0;i<stringPlayer.length;i++){
            var regexpPlayerName = new RegExp('target="_self">(.*)</a>');
            var playerNameAway = stringPlayer[i].match(regexpPlayerName)[1];
            var playerNameHome = stringPlayer[i].substring(stringPlayer[i].length/2).match(regexpPlayerName)[1];

            var regexStat = new RegExp('</h2>\n' +'\t\t\t(.*)\n' +'\t\t</div>');
            var statPlayerAway = stringPlayer[i].match(regexStat)[1];
            var statPlayerHome = stringPlayer[i].substring(stringPlayer[i].length/2).match(regexStat)[1];
            var jsonPlayer = {
                nomJoueurExterieure : playerNameAway +" ||| Stat :"+statPlayerAway,
                nomJoueurDomicile : playerNameHome +" ||| Stat : "+statPlayerHome
            }
            tabPlayerTotal.push(jsonPlayer);
        }
        return tabPlayerTotal;
    }
    // tabPlayerTotal = getTopPerformer(tabStringPlayer);
    try{
        tabScheduleTotal = getScheduleFromString(tabStringTime);
    }catch(error){
        console.log("Match terminé")
    }

    
    //console.log(tabPlayerTotal);
    tabInfoTotal = getScoreFromString(tabStringTeam);
    //console.log(tabInfoTotal[0].name);
    const getResultat = (stringInfoTotal) => {
        tabResultat = [];
        for(let i=0;i<stringInfoTotal.length;i=i+2){
            var jsonResult = {
                opposition : stringInfoTotal[i].abrev +" "+ stringInfoTotal[i].name +" vs "+stringInfoTotal[i+1].abrev +" "+ stringInfoTotal[i+1].name,
                score : stringInfoTotal[i].totalPoints + "-" + stringInfoTotal[i+1].totalPoints,
            }
            if(stringInfoTotal[i].totalPoints==0 && stringInfoTotal[i+1].totalPoints==0){
                jsonResult['date'] = tabScheduleTotal[i-(i/2)]['date']
                jsonResult['horaire'] = tabScheduleTotal[i-(i/2)]['horaire']
            }
            tabResultat.push(jsonResult);
        }


        return tabResultat;
    }
    tabResultat = getResultat(tabInfoTotal);

    
    return tabResultat;
}



const getDateFromCalendar = (calendrier) => {
        
        var dateActuelle = new Date();

        jourDecalage = []

        for (let i=0;i<calendrier.length;i++){
            var date = new Date(calendrier[i])
            var diffTime = -(dateActuelle - date);
            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            // console.log(diffTime + " milliseconds");
            // console.log(diffDays + " days");
            jourDecalage.push(diffDays)
        }

        matchJoue = 0
        indexMatch = calendrierThunder.length-3

        for (let i=0;i<jourDecalage.length-1;i++){
            if(jourDecalage[i]<0){
                matchJoue = matchJoue+1
            }
            if(jourDecalage[i]<0 && jourDecalage[i+1]>=0){
                indexMatch = i+1;
            }
        }
        if(matchJoue<2){
            return [calendrierThunder[0],calendrierThunder[1],calendrierThunder[2],calendrierThunder[3],calendrierThunder[4]]
        }
        else{
            return[calendrierThunder[indexMatch-2],calendrierThunder[indexMatch-1],calendrierThunder[indexMatch],calendrierThunder[indexMatch+1],calendrierThunder[indexMatch+2]]
        }


}



const getUrlFromDate = (dateMatch) => {
    //var date = new Date('July 05, 69 00:20:18');
    var date = new Date(dateMatch);
    
    var month = date.getMonth();
    month = month+1; //on commence les mois à l'indice 0

    var day = date.getDate();
   
    if(month<10){
        month=month.toString();
        month='0'+month;
    }

    if(day<10){
        day=day.toString();
        day='0'+day;
    }
    var url = 'https://www.espn.com/nba/scoreboard/_/date/'+date.getFullYear()+month+day;
    return url;

}
const getAllUrls = (listeMatch) => {
    listeUrls = []
    for(let i=0;i<listeMatch.length;i++){
        listeUrls.push(getUrlFromDate(listeMatch[i]))
    }
    return listeUrls;
}






const sendDataThunder = async(calendrier) =>{
    listeMatchDisplay = getDateFromCalendar(calendrier);
    listeUrl = getAllUrls(listeMatchDisplay)
    dataThunder = []
    for(let i=0;i<listeUrl.length;i++){
        output = await getDataOfAllTeams(listeUrl[i]);
        indexThunder = 0
        for (let j=0;j<output.length;j++){
            if(output[j]['opposition'].search("Thunder")!=-1){
                indexThunder = j;
            }
        }
        dataThunder.push({ ["Match "+(i+1)] : output[indexThunder]})
        
    }
    console.log(dataThunder)

}

calendrierThunder = ["12/23/2020","12/26/2020","12/28/2020","12/29/2020","12/31/2020",
                      "1/2/2021","1/4/2021","1/6/2021","1/8/2021","1/10/2021",
                      "1/12/2021","1/13/2021","1/15/2021","1/17/2021","1/19/2021",
                      "1/22/2021","1/23/2021","1/25/2021","1/27/2021","1/29/2021",
                      "2/1/2021","2/3/2021","2/5/2021","2/6/2021","2/8/2021",
                      "2/10/2021","2/12/2021","2/14/2021","2/16/2021","2/19/2021",
                      "2/21/2021","2/22/2021","2/24/2021","2/26/2021","2/27/2021",
                      "3/3/2021","3/4/2021"]

sendDataThunder(calendrierThunder)
// console.log(output)
// test = JSON.parse(output)
// console.log(test)
// if(output.search("Thunder")!=-1){

// }