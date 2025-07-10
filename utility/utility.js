function skillMinigame (type, userlevel) {
 
    var reward = [25, 50, 100, 200];

      switch(type) { 
    //-----------------------------------        
        case "fish":
           reward = reward.map(element => element*40); // 1000 base (25*40)
          break;
    //-----------------------------------      
        case "hunt":
           reward = reward.map(element => element*60); // 1500 base (25*60)     
          break;

    //-----------------------------------   
        case "gather":
           reward = reward.map(element => element*20); // 500 base (25*20)     
          break;

    //-----------------------------------         
        case "craft":
           reward = reward.map(element => element*80); // 2000 base (25*80)     
          break;

    //-----------------------------------       
        case "work":
           reward = reward.map(element => element*100); // 2500 base (25*100)     
          break;

    //-----------------------------------       
        default:
          return "Something went horribly wrong. Sorry about that.";
    }
 
 
    //Percent chance, each index 0-5 = userlevel 0-5, each array is arranged by rarity lowest>highest
    var chance = [
       [42, 26, 21, 10], //default
       [32, 30, 24, 14], //level 1
       [24, 32, 27, 17], //level 2
       [14, 34, 30, 22], //level 3
       [12, 30, 34, 24], //level 4
       [10, 24, 38, 28]  //level 5
     ];
 
 
    //converts % chance into upper and lower bounds
    var upper = [
     100, 
     100-chance[userlevel][0], 
     100-chance[userlevel][0]-chance[userlevel][1], 
     100-chance[userlevel][0]-chance[userlevel][1]-chance[userlevel][2]
     ];

     var lower = [
     100-chance[userlevel][0], 
     100-chance[userlevel][0]-chance[userlevel][1], 
     100-chance[userlevel][0]-chance[userlevel][1]-chance[userlevel][2],
     100-chance[userlevel][0]-chance[userlevel][1]-chance[userlevel][2]-chance[userlevel][3],
     ];

    //Decision-making logic
     var result = Math.floor((Math.random() * 5));
     var choose = Math.floor((Math.random() * 99))+1;
 
     var min, max;
     if(choose <= upper[0] && choose >= lower[0]) { choose = 0; min = 0; max = reward[0]; }
     else if(choose <= upper[1] && choose >= lower[1]) { choose = 1; min = reward[0]; max = reward[1];  }
     else if(choose <= upper[2] && choose >= lower[2]) { choose = 2; min = reward[1]; max = reward[2];  }
     else if(choose <= upper[3] && choose >= lower[3]) { choose = 3; min = reward[2]; max = reward[3];  }
     else { choose = 0; min = 0; max = reward[0]; } // Default fallback

     let amount = Math.floor(Math.random() * ( max - min ) + 1 + min); //choose reward amount
 
     var finalresult = [choose, result, amount]; //choose = rarity array lowest>highest, result = rarity index, amount = kopek reward
     return finalresult;  
}

module.exports = { skillMinigame };
