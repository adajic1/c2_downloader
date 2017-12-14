// SYNTAX
// casperjs --web-security=no download.js <id_of_subject> [<username> <password>]
// EXAMPLE CALL TO DOWNLOAD TP
// casperjs --web-security=no download.js 76
/* ############################################################ */
/* ################### DEVELOPED BY Ice_VII ################### */
/* ############################################################ */
// https://bitbucket.org/ariya/phantomjs/downloads

var startTime=Date.now(); // Start of the program
var begUrl="https://c2.etf.unsa.ba"; // First part of urls
var fs = require('fs'); // To work with files
var casperReq = require('casper');
var page = require('webpage').create(); // To use phantomjs page object
var loaded=0; // State variable, counting stages
var system = require('system'); // To get access to console arguments
var args = system.args;
var subjectId=""; // Id of subject will come as command line argument
var loginProvided=false; // Login details provided or not
var username=""; // Credentials
var pass="";
var idevi=[]; // Array of ids to be downloaded
var fold=[]; // Array with folder names in form of sedmica_<WEEK>
var folder=""; // Subject name + / + fold
var oldFolder=""; // Console log whenever folder changes
var linkFile=""; // Full url link to a resource file
var filename=""; // Name of file extracted from the url
var resurs; // Is the current link a file resource or not
var done; // Checking resourceRequests only while done==false
var subjectTitle=""; // Will read it from the <title> tag from the website
var tr=-1; // Index of the id currently being processed

/* 
 * Modified decode function from casper.js clientutils 
 * https://github.com/casperjs/casperjs/blob/master/modules/clientutils.js
*/
var BASE64_DECODE_CHARS = [
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
];

/**
 * Decodes a base64 encoded string. Succeeds where window.atob() fails.
 *
 * @param  String  str  The base64 encoded contents
 * @return string
 */
var decode = function decode(file, str) {
    /*eslint max-statements:0, complexity:0 */
    var c1, c2, c3, c4, i = 0, len = str.length;
	var fOut = fs.open(file, 'wb');
    while (i < len) {
        do {
            c1 = BASE64_DECODE_CHARS[str.charCodeAt(i++) & 0xff];
        } while (i < len && c1 === -1);
        if (c1 === -1) {
            break;
        }
        do {
            c2 = BASE64_DECODE_CHARS[str.charCodeAt(i++) & 0xff];
        } while (i < len && c2 === -1);
        if (c2 === -1) {
            break;
        }
        fOut.write(String.fromCharCode(c1 << 2 | (c2 & 0x30) >> 4));
        do {
            c3 = str.charCodeAt(i++) & 0xff;
            if (c3 === 61) {
				fOut.close();
                return 0;
            }
            c3 = BASE64_DECODE_CHARS[c3];
        } while (i < len && c3 === -1);
        if (c3 === -1) {
            break;
        }
        fOut.write(String.fromCharCode((c2 & 0XF) << 4 | (c3 & 0x3C) >> 2));
        do {
            c4 = str.charCodeAt(i++) & 0xff;
            if (c4 === 61) {
				fOut.close();
                return 0;
            }
            c4 = BASE64_DECODE_CHARS[c4];
        } while (i < len && c4 === -1);
        if (c4 === -1) {
            break;
        }
        fOut.write(String.fromCharCode((c3 & 0x03) << 6 | c4));		
    }
	fOut.close();
};    

console.log("------------------------------");
console.log("AUTOMATIC C2 COURSE DOWNLOADER");
console.log("----------BY ICE_VII----------");
console.log("------------------------------");

if (args.length <= 4) {
  console.log('Syntax: casperjs --web-security=no download.js <id_of_subject> [<username> <password>]');
  phantom.exit();
} else {
	subjectId=args[4];
	if (args.length>5) {
		username=args[5];
		loginProvided=true;
		if (args.length>6) 
			pass=args[6];
		else {
			console.log('Syntax: casperjs --web-security=no download.js <id_of_subject> [<username> <password>]');
			phantom.exit();
		}
	}
}
var url = begUrl+"/course/view.php?id="+subjectId;

function getFilename(str) {
    return str.split('\\').pop().split('/').pop();
}

page.onError = function(msg, trace) {
  var msgStack = [msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
    });
  }
  // console.error(msgStack.join('\n')); // Keep commented if you don't want to see some weird error logs from require.min.js (just ignore them)
};

page.open(url);			
page.onLoadFinished = function(status) {
	if (status === 'success') { // The website is opened successfully
		if (loaded==0) {
			loaded=1;
			console.log("The login website was loaded successfully");
			page.evaluate(function(loginProvided,username,pass) {
				if (!loginProvided) {
					document.getElementById("guestlogin").submit();
				} else {
					document.getElementById("username").value=username;
					document.getElementById("password").value=pass;
					document.getElementById("login").submit();
				}				
			},loginProvided,username,pass); 
		} else if (loaded==1) {
			loaded=2;
			uspjelo=page.evaluate(function() {
				return document.documentElement.outerHTML.indexOf("Invalid login")==-1;			
			}); 
			if (!uspjelo) {
				console.log("Wrong username or password");
				phantom.exit();
			}
			if (!loginProvided) console.log("Guest login success");
			else console.log("Login success");
			page.open(begUrl+"/course/view.php?id="+subjectId,function(status){
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
								$("tr[id^='section-'],li[id^='section-']").each(function(){
									$(this).find("a[href^='"+begUrl+"/mod/resource/view.php?id=']").each(function() {
										vrati+=getParameterByName('id',$(this).attr('href'))+" ";											
									});
									vrati+="\n";
								});								
								return vrati;
							},begUrl);
							subjectTitle=page.evaluate(function() {
								return $('title').text();
							});
							poz=0;
							var new_subjectTitle="";
							while (poz<subjectTitle.length && subjectTitle.charAt(poz)==' ') poz++;
							while (poz<subjectTitle.length) {
								if (subjectTitle.charAt(poz)!=':' && subjectTitle.charAt(poz)!=';')
									new_subjectTitle+=subjectTitle.charAt(poz);
								poz++;
							}
							subjectTitle=new_subjectTitle.trim();
							console.log(subjectTitle);
							if (!fs.exists(subjectTitle))
								fs.makeDirectory(subjectTitle);
							// page.zoomFactor=1;
							// page.render(subjectTitle+'/Browser_screenshot.png');
							// console.log("Browser_screenshot.png has been generated");	
							folderi=podaci.split("\n");
							for (var i=0; i<folderi.length-1; i++) {
								var ids=folderi[i].split(" ");
								for (var j=0; j<ids.length-1; j++) {
									if (idevi.indexOf(ids[j])==-1) {
										idevi.push(ids[j]);
										fold.push("sedmica_"+i.toString());
									}
								}
							}			
							setTimeout(function(){delete page; download();},1);									
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
	if (!done && requestData.url.indexOf(begUrl+"/pluginfile.php/")!=-1) {
		linkFile=requestData.url;	
		filename=getFilename(linkFile);
		resurs=true;
		done=true;
	}
}
	
function download() {
	tr++;
	if (tr==idevi.length) {
		var endTime=Date.now();
		var difference=(endTime-startTime)*1.0/1000;
		console.log("FINISH");
		console.log("Total download time: "+difference.toString()+" secs");
		if (idevi.length==0) {
			var message="\nNOTES:\nThe process finished with zero downloaded files? Try to use your credentials instead of the guest login syntax.";
			message+="\nIt finished with zero downloaded files AGAIN? Enroll yourself manually on the course, then try again.";
			console.log(message);
		}
		phantom.exit();
	}
	var downlink=begUrl+"/mod/resource/view.php?redirect=1&id="+idevi[tr];
	folder=subjectTitle+"/"+fold[tr];
	if (folder!=oldFolder) {
		console.log("Folder: "+fold[tr]);
		oldFolder=folder;
	}
	if (!fs.exists(folder))
		fs.makeDirectory(folder);
	done=false;
	resurs=false;
	casper=casperReq.create({
		pageSettings: {
			webSecurityEnabled: false,
			loadImages : true,
			loadPlugins : false,
			userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:17.0) Gecko/20100101 Firefox/17.0'
		}
	});
	casper.on('resource.requested', onResourceRequested); // Listening only while done==false
	casper.start(downlink);	
	casper.then(function(){
		done=true;
		if (resurs) {
			console.log("    "+(tr+1).toString()+"/"+idevi.length+" Saving "+filename+" id="+idevi[tr]);
			
			// this.download(linkFile, folder+"/"+filename); // Fails for some files like: "36835" from subject 223
			// Probably GC related problem in base64 decoding process...
			
			decode(folder+"/"+filename, this.base64encode(linkFile)); // This version of download function works excellent though.
		} else {
			console.log("    "+(tr+1).toString()+"/"+idevi.length+" Saving "+idevi[tr]+".html id="+idevi[tr]);
			var html = this.getPageContent();
			var f = fs.open(folder+"/"+idevi[tr]+".html", 'w');
			f.write(html);
			f.close();
		}
	});
	casper.run(function() {
		setTimeout(function(){
			casper.page.close();
			casper.page = require('webpage').create();
			download();
		},1);
	});	
}

/* ################### DEVELOPED BY Ice_VII ################### */