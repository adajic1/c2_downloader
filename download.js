// SYTNTAX
// casperjs --load-images=no --ignore-ssl-errors=yes download.js <id_of_subject> [<username> <password>]
// EXAMPLE CALL TO DOWNLOAD TP
// casperjs --load-images=no --ignore-ssl-errors=yes download.js 76
/* ############################################################ */
/* ################### DEVELOPED BY Ice_VII ################### */
/* ############################################################ */

var startTime=Date.now();

begUrl="http://c2.etf.unsa.ba";
var fs = require('fs');
var page = require('webpage').create();
var startTime=Date.now();
var endTime;
var loaded=0;
var system = require('system');
var args = system.args;
var id_predmeta="";
var login_data=false;
var username="";
var pass="";
var idevi=[];
var fold=[];
var folder="";
var stariFolder="";
var linkFile="";
var filename="";
var old_filename="";
var skiniResurs=true;
var naslov="";
var tr=-1;

console.log("------------------------------");
console.log("AUTOMATIC C2 COURSE DOWNLOADER");
console.log("----------BY ICE_VII----------");
console.log("------------------------------");

if (args.length <= 4) {
  console.log('Syntax: casperjs --load-images=no --ignore-ssl-errors=yes download.js <id_of_subject> [<username> <password>]');
  phantom.exit();
} else {
	id_predmeta=args[4];
	if (args.length>5) {
		username=args[5];
		login_data=true;
		if (args.length>6) 
			pass=args[6];
		else {
			console.log('Syntax: casperjs --ignore-ssl-errors=yes --load-images=no down.js <id_of_subject> [<username> <password>]');
			phantom.exit();
		}
	}
}
var url = begUrl+"/course/view.php?id="+id_predmeta;

function getFilename(str) {
    return str.split('\\').pop().split('/').pop();
}
page.open(url);			
page.onLoadFinished = function(status) {
	if (status === 'success') { // The website is opened successfully
		if (loaded==0) {
			loaded=1;
			console.log("The login website was loaded successfully");
			page.evaluate(function(login_data,username,pass) {
				if (!login_data) {
					document.getElementById("guestlogin").submit();
				} else {
					document.getElementById("username").value=username;
					document.getElementById("password").value=pass;
					document.getElementById("login").submit();
				}				
			},login_data,username,pass); 
		} else if (loaded==1) {
			loaded=2;
			uspjelo=page.evaluate(function() {
				return document.documentElement.outerHTML.indexOf("Invalid login")==-1;			
			}); 
			if (!uspjelo) {
				console.log("Wrong username or password");
				phantom.exit();
			}
			if (!login_data) console.log("Guest login success");
			else console.log("Login success");
			page.open(begUrl+"/course/view.php?id="+id_predmeta,function(status){
				page.includeJs("http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js",function() {
					if (status === 'success') { // The website is opened successfully
						if (loaded==2) {
							loaded=3;
							console.log("The website of the subject loaded successfully")								
							podaci=page.evaluate(function(begUrl) {
								vrati="";
								function getParameterByName(name, url) {
									if (!url) url = window.location.href;
									name = name.replace(/[\[\]]/g, "\\$&");
									var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
										results = regex.exec(url);
									if (!results) return null;
									if (!results[2]) return '';
									return decodeURIComponent(results[2].replace(/\+/g, " "));
								}
								$("tr[id^='section-']").each(function(){
									$(this).find("a[href^='"+begUrl+"/mod/resource/view.php?id=']").each(function() {
										vrati+=getParameterByName('id',$(this).attr('href'))+" ";											
									});
									vrati+="\n";
								});								
								return vrati;
							},begUrl);		
							naslov=page.evaluate(function() {
								return $('title').text();
							});
							poz=0;
							new_naslov="";
							while (poz<naslov.length && naslov.charAt(poz)==' ') poz++;
							while (poz<naslov.length) {
								if (naslov.charAt(poz)!=':' && naslov.charAt(poz)!=';')
									new_naslov+=naslov.charAt(poz);
								poz++;
							}
							naslov=new_naslov;
							console.log(naslov);
							if (!fs.exists(naslov))
								fs.makeDirectory(naslov);
							page.zoomFactor=1;
							page.render(naslov+'/Browser_screenshot.png');
							console.log("Browser_screenshot.png has been generated");	
							folderi=podaci.split("\n");
							for (var i=0; i<folderi.length-1; i++) {
								ids=folderi[i].split(" ");
								for (var j=0; j<ids.length-1; j++) {
									idevi.push(ids[j]);
									fold.push("sedmica_"+i.toString());
								}
							}			
							download();									
						}
					}
				});
			});				
		} 
	} else {
		console.log("ERROR: couldn't load the website");
		console.log("status="+status);
		phantom.exit();
	}
};

function onResourceRequested(requestData, request) {
	if (requestData.url.indexOf(begUrl+"/file.php/")!=-1) {
		linkFile=requestData.url;	
		filename=getFilename(linkFile);
		if (filename==old_filename)
			skiniResurs=false;
		else 
			skiniResurs=true;
		old_filename=filename;
	}
}
	
function download() {
	tr++;
	if (tr==idevi.length) {
		endTime=Date.now();
		difference=(endTime-startTime)*1.0/1000;
		console.log("FINISH");
		console.log("Total download time: "+difference.toString()+" secs");
		if (idevi.length==0) {
			message="\nNOTES:\nThe process finished with zero downloaded files? Try to use your credentials instead of the guest login syntax. ";
			message+="\nIt finished with zero downloaded files AGAIN? Enroll yourself manually on the course, then try again. ";
			message+="\nCheck the image "+naslov+"/Browser_screenshot.png to get an idea what's happening in the headless webkit browser.";
			console.log(message);
		}
		phantom.exit();
	}
	downlink=begUrl+"/mod/resource/view.php?id="+idevi[tr];
	folder=naslov+"/"+fold[tr];
	if (folder!=stariFolder) {
		console.log("Folder: "+fold[tr]);
		stariFolder=folder;
	}
	if (!fs.exists(folder))
		fs.makeDirectory(folder);
	var casper=require('casper').create({
		pageSettings: {
			webSecurityEnabled: false
		}
	});
	casper.start(begUrl+"/mod/resource/view.php");	
	casper.thenOpen(begUrl+"/mod/resource/view.php?inpopup=true&id="+idevi[tr]);	
	casper.on('resource.requested', onResourceRequested);
	casper.then(function(){
		if (skiniResurs) {
			console.log("    "+(tr+1).toString()+"/"+idevi.length+" Saving "+filename+" id="+idevi[tr]);
			this.download(linkFile, folder+"/"+filename);
		} else {
			console.log("    "+(tr+1).toString()+"/"+idevi.length+" Saving "+idevi[tr]+".html id="+idevi[tr]);
			var html = this.getPageContent();
			var f = fs.open(folder+"/"+idevi[tr]+".html", 'w');
			f.write(html);
			f.close();
		}
	});
	casper.run(function() {
		download();
	});	
}

/* ################### DEVELOPED BY Ice_VII ################### */