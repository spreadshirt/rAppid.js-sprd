var assert = require('chai').assert;

describe("street matcher", function() {

    var parseStreet = require(__dirname + "/../sprd/helper/StreetParser").parseStreet;

    var positives = ["Jan Lindtstraat 10", "VIA DELL'INDUSTRIA, 60", "Teldershof 51", "Allaniaweg 12", "23 Ledcameroch Park", "Holzweg 6", "Ahornweg 42", "Wilhelmstraße 1", "33 rue de mundolsheim", "Rudi-Seibold-Str. 29", "Marienallee 36a", "Rosenheimerstr. 145 D", "Hohmadstrasse 38G", "Ostlandstraße 7", "69 rue du rouet", "Dorfstraße 6", "27 Avenue Beau", "corso Casale 297bis", "Panoramastraße 18", "8 impasse de la lisière", "Duracher Str. 93", "Fastlagsgatan 41", "Klistostraße 13", "Kaskikatu 5", "36 Avenue Jean Jaures", "Puntmos 42", "Walburgisstr. 3", "Viale Dell Inovazionne 22", "5 AVENUE FONTAINE DESVALLIERES", "Gunzing 11A", "11 Frolesworth Road", "Omptedastraße 27", "Kalstert 54", "Box 857", "6 rue nationale", "516 route d'Angresse", "73 Glencoyne Drive", "86 rue eugene mopin", "36 Rue Alphonse Grosse", "Sebastianstraße 26", "Birkenstraße 34/1", "Schulstrasse 14b", "Själlandstorget 2e", "Spangesekade 53", "56 ALLEE DES POMMIERS", "18 rue pierre et marie curie", "20 RUE PIERRE FELIX DELARUE", "Rte de la Coudre 25", "Zweikirchen 16", "P.J. Noel Bakerstraat 110", "1 Allée Du Docteur Lamaze", "Emsener Straße 31", "smedjegatan 1b", "Blåbærvej 7", "Hospitalstraße 6", "Walpersdorferstraße 56", "Johan de Wittlaan 245", "Breisemstraat 137", "10 impasse des trois rivières", "9 Wynall Lane", "Kranichsteiner staße 31", "Idrottsvägen 29A", "27 rue Roger Salengro", "Wasa straße 5", "Mühlgasse 2", "Oberaich 26", "Hösbacher Weg 14", "Königsbergerstr. 5", "Hauptstr. 86", "120 route de Beugnon", "47 rue Villette", "6 rue Christian Pfister", "27 rue Jules Ferry", "9 Avenue du Cimetière", "13 Drummond Road", "Lichterveldestraat 39", "87 Peverel road", "VICOLO COSTONE 4", "Ratavartijankatu 4 C 63", "85 rue du mont cenis", "Riedweg 2", "78 rue danton", "fransebaan 609", "Schulstrasse 4", "Bahnhofstraße 33", "kirchstraße 33a", "Victor-Gollancz-Straße 18", "Friedrich Penseler Straße 10", "Wiesensteig 47", "Kiesgasse 7", "c/ San Narciso 14 4º C", "Faluner Weg 28", "hauptstr. 28", "lepelaar 50", "feldbergstrasse 6", "Veerpoortstraat 28", "Hugenmattweg 11b", "Lottastigen 4", "Anzengruberstrasse 17", "Klokkervang 3", "Schlachthofstraße 16", "Auf dem Klingenberg 35", "Teltower Strasse 2A", "7, Graham Road,", "2 avenue du docteur Houselot", "Via Rossini n.29", "11 Tide Mills Way", "Marelstraat 73", "1 Houndwood Drove", "Grodenstr. 8", "Kotikyläntie 7 E 83", "140 coltsfoot gardens", "1 SchoolHouse Mews", "56 rue des piboules", "Elingårdsveien 3", "c/o Dedagroup Spa, Loc. Palazzine 120/F", "8, rue du Collège", "86 Grande Rue", "156 rue Léon Maurice Nordmann", "30 Sunninghill Close", "Rue de Trèves 49-51, Box 14", "Ballenbergstr. 14 A", "39 rue de la republique", "Fuggerstr. 1", "Landsberger Allee 220", "Via luigi Guercio 44 Salerno", "Morgensternstraße 30", "Holzhofgasse 19", "Herbornerstr.31", "Am Damm 10", "Koning Leopold III Laan 48", "Tiimalasintie 4 A 25", "Lindenhof 11", "Allee der Kosmonauten 145", "1 rue ARISTIDE MAILLOL", "Lohgerberstr. 7", "3 Exmouth Close", "Ejercito Nacional 977", "Josefstraße 29a/13", "29 rue du rhône", "Prost Hallingsvei 8", "48 rue Parmentier", "Rue Arbroy 13", "17 Huntstown Road", "Lohwarf 10", "Mühlheimer Str. 20", "46 Glengarnock Avenue", "Skolvägen 21", "Mainzer Str. 79", "Via cimitero 20", "Leipziger Platz 14", "995 chemin de saint just", "115 Earls Lane", "26 chemin du vieux pont", "320 Boulevard Harpignies", "Vooreel 6", "Tupolevlaan 107A", "12 rue de la Mayenne", "Calle salvador allende Casa 1", "Darmstädter Landstraße 112", "konventveien 13", "Via Marco Fanno, 1", "Poststrasse 6", "Tycke Norrgård 230", "via Monte Rosa 52", "57 avenue du chateau", "Alte Hünxer Str. 95", "Bergstraße 5", "1 SQUARE DE LA PAIX", "via Terpi 23 - 9b", "Hauptstraße 78", "4 RUE DES FAYARDS", "20 Avenue Albert Einstein", "Université Paris XI. Bât 510", "Hauptwachstraße 10", "Strohuls 69", "Gartenstraße 36", "20 ingham road", "2 rue Maurepas", "via canne 47", "Juhestr. 7", "Tulpangatan 1", "Smedevej 17", "Hertigswalde 134", "Tombergsweg 3", "73 residence roger bouvier, rue de Lille", "Robert-Bosch-Str. 20", "Tjernagelvegen 73", "kanaalkade 43", "Zum Emstal 19", "111 route de mons", "Sandkrug 17", "Oberer Ammerhof 1", "Wilhelm-Boelsche-Str. 22", "c/o eng Hornsgatan 72a", "Dåvane 24", "Druivenstraat 64", "Karl- Marx- Str.  29", "Schönstr. 29", "Drinkwaterweg 366", "3 camí de montou", "Gustav Festenberggasse 11", "St. Norbertus Str. 12", "Farrelstraße 6", "Teunenmijns 9", "Curt-Stenvert-Bogen 21", "Øvre Skytterholmen 42", "3 The Saplings", "Parklaan 22 bus 1", "Roten Rain 16", "Naheweinstraße 62", "Weißer Rabe 15", "Erikastraße 7", "Vikatoppveien 2", "Ringstraße 37/2", "brotäckerstrasse 9", "1A rue Turcon", "Kastanienallee 4", "Charlotte-Salmon-Hain 11", "Ziegelstraße 50", "Auf dem Bohnenkamp 32/34", "Parksiedlung 18/1", "Finkenweg 7", "75 Station Avenue", "Höhenweg 1", "Helmholtzstr. 2-9", "Bankastraat 5", "Obere Dorfstraße 8", "51 route de garche", "Kolkmannstrasse 13", "Avenue Thomas Edison 121", "37,rue de Steinfort", "Rua dos Moinhos Nº 33, Vale de Cardosos", "P. Calandlaan 925", "99 Bathurst Walk", "Kaiserstraße 81", "13 avenue du Général Leclerc", "Haagstraße 2", "Jon P. Erliens vei 6", "Via Cumano 11", "Boekweitbloemstraat 9", "43 Meadway", "91 bridge lane", "Muninsvei 6", "11 impasse bethléem", "Oderstraße 30", "Sudetenstraße 40", "37 ELM PLACE", "24 RUE NEUVE", "Ferdinand-Gabriel-Weg 10", "Myrvollveien 17A", "Ankdammsgatan 40", "7 allée des hirondelles", "Telschowstr. 30", "4, route Principale", "Kleinschmitthauser Weg 11", "Liegnitzer Str. 12", "Sont 8", "Wiesenweg 5-7", "Bittenbrunn 14", "mejia lequerica 36 7º 4ª", "69 rue Armand Carrel", "Züricherstrasse 29", "Wesloer Straße 112", "8 impasse de l aye", "Viale Mazzini 178/D", "sundahlstr. 1", "5 rue Lannes", "Friedrich-Ludwig-Jahn-Straße 1", "36 rue Gabrielle", "Pianoweg 10", "Paul-Ehrlichstr.59A", "Rue des bas champs 28", "Kalinowa 12", "tannenbühl 20", "Tistrupvej 1", "Munkemaen 231C", "Rosenthaler Weg 59", "Baljuwstraat 19", "42 The Ridgeway", "2 rue Parmentier", "fritz-rutten-str. 1", "Sturenberg 45", "Giuliani 12", "Hofangerweg 3", "Bagarova 36", "Franz-Rabe-Str. 32", "Johann Weber Str. 90/12", "14 Park Road", "Parkweg 134B", "Im Kreuz 6", "40 rue cuvier appt 17", "Hafenstrasse 49", "Römerstrasse 22/3", "Richthofenstrasse 59", "27 rue Godefroy-Cavaignac", "Bünteweg, 17", "Überseering 18", "Übertal 13", "17 RUE DE BARSAC", "Sportsvænget 7", "42 Gibraltar Road", "103 Av de Versailles", "Engelsgrube 62-64", "auf der haid 6a", "Fasanenstraße 6", "Flughafenstrasse 59", "Rebenweid 12", "90 rue Anatole France", "Michelangelostr. 105", "Rheinfeldener Allee 38", "Flat 9, Belsize Grange", "Muthesiusstrasse 6", "Karlstraße 47", "9 route de la Rue", "Neunkircher Str. 196", "Trierer Straße 70-72", "08 rue de Cheverny", "72 rue Laennec", "18 rue du Moulin Bailly", "16 rue du QUERIGUT", "32 rue du petit delbourg", "Poolstraße 38", "Herpersdorf 11", "Kirchenstraße 2", "Jakob-Stoll Str. 97", "Hessenstr. 4", "Bilker Allee 68", "Nordring 16", "Postboks 4030", "Bürgermeister-Neuwirth-Str. 11", "Västergatan 6 E", "28 RUE MARECHAL FOCH", "Auf der Egge 4", "Via dei Walser 20/b", "Wiener Straße 60", "Hermann-Müller-Straße 7", "Rilkestraße 3a", "8, rue de La Pouparderie", "Georgstr. 6", "3 Impasse Corot", "4 place du murger", "Karl-Dillinger-Straße 135", "Gradestr. 94", "76 chapel lane", "Churerstrasse 96", "Dehmkerbrocker Str.1", "5 impasse du général Harispe", "località Piceda 4", "Philipp- Faust- Str.12", "Elzenhage 1", "Städeligarten 9", "Schloß Straße 22", "Str. d. Freundschaft 11", "Heinrich-Pierson Straße 4", "Clemens -August -Str. 1", "Dr.-Herbert-Quandt-Straße 74", "Lägernstrasse 15", "Adolf- Ehrtmann- Straße 4", "93 Winchester road", "39 avenue de l'Europe", "Lijsterbesstraat 232", "Smedkåsvegen 40", "viale Garibaldi 71/B", "Møllevej 89", "33 grande rue", "Schulstrasse 6", "Fresiavej 8B", "Farnstieg 3", "Meiborssen 36 A", "Leuschnerstr.8", "Jakobistraße 11", "10 Merton Road", "Johanneskamp 51", "Gesellenweg 13", "12 Hamilton Close", "St. Martin 16", "Duinmeierij 79", "Alte Schulstr. 04", "Berchemstadionstraat 70", "Blütenweg 26", "Außerhalb 0", "Åkersvingen 18", "Werndlstraße 67", "4, Basse Rue", "Lessingstraße 44", "25 chemin du moulin", "Senderstraße 70", "SchaepmanStraat 11", "Am Sumpf 9", "Bahnhofstr. 17", "Novalisstraße 10", "Rua Nova do Almada, 59 - 4º Andar", "syvendeskovvej 37", "Akazienweg 2", "Wöberweg 8", "Taxandrialaan 67", "Auf dem Hainspiel 36", "Ulmenstr.9", "Alte Gartenstr. 11", "3 Richmond Hill", "Cite al wafa residence fidia 2 bloc 4", "Körvelgatan 19B", "Lister Straße 15", "1 Leigh Common", "Kaiserstr. 14b", "19 All Saints Road", "UniCredit Bank Austria AG, Abt. 8979", "Vuolukiventie 1b E105", "Haageinde 14", "Salhusberget 5", "Holunderallee 26", "95 BIS QUAI LOUIS FERBER", "18 RUE DU 8 MAI 1945", "Renggerstr. 56", "8 rue du clos Meslier", "Løddberget 2", "Geitlingstr. 2", "12 lighthorne road", "4 rue rochier", "Tramsingel 23", "Malta 63", "18 rue de Bas-rivière", "24 rue Louis Blanc", "Villars-le-Grand 9b", "Gögginger Str. 70", "Redigäcker 8", "33 Hanson", "73 Avenue de l'Europe", "blomstervägen 3", "Franz Skribanygasse 2/2/19", "Bahnhofstraße 20/1/4", "44 RUE MARCOURT", "STRADA CIPATA 40E", "Ågatan 15 C", "Myntinsyrjä 9 D 66", "Glockenspitz 455", "sörbäcksgatan 38", "58 cours Becquart Castelbon", "125 rue de Saint Cloud", "Neue Dorfstrasse 83", "8324 McFall Drive", "2 BIS IMPASSE DENSUS", "Voetballersstraat 25 bus 4", "11 rue robert adam", "Thornstr. 31", "Hauptstrasse 396", "Weiherstraße 12", "Skåtaberget, 11", "14 Oakhampton road", "C/Priorat, 2  3º 3ª", "Siebendstraße 35", "Vänortsvägen 106 lgh 1101", "Alleestraße 17", "Warthaerstraße 13", "159 boulevard Charles de Gaulle", "Lüneburger Str. 22", "Richtstr. 54", "Im Stühlinger 10", "Lilienstr. 12", "Göschenstraße 14", "Lange Str. 20", "Bahnhfstraße 76", "Treskowstr. 63", "5 ter rue victor hugo", "Lillebergsvingen 2", "Obersteinbach 7", "Oberdörferstraße 66", "Am Schlossberg 5", "fuhsestraße 2a", "22 avenue de Boulbonne", "Lönsstraße 2", "Keinstraße 12", "8 rue d'alsace", "8 rue du collège", "Meistersingerstraße 9", "Angerkamp 13", "Herenstraat 6K", "8 rue Dailly", "Spaarstraat 5", "Angyal u. 1-3.", "Marburger Straße 22", "Strasse der Republik 55", "100 RECTORY GROVE", "1 winton close", "An der Feuerwache 4", "26 rue de la sauvetat", "Zangersbos 2", "Grimbergstraße 45", "Drottninggatan 4", "sandeslättskroken 31", "210 wisbech road", "3 rue de la baleine du groenland", "1 allée des charmilles", "Lagerhausweg 30", "Gothaerstraße 5", "abbringstraat 46", "Dachauer Str. 29", "Rheinstraße 33", "26 AV RENE DUGUAY TROUIN", "256 FIFTH AVENUE", "Pflügerstraße 20", "Seekoppel 1b", "79 avenue lacassagne", "48 bis avenue Louis Didier", "via edera 20/42", "Hermann-Hesse-Str. 24", "Poggenmühle 1", "Mühlestrasse 13", "44 bis route de versailles", "Sepänkatu 16 A 8", "Hölderlinstrasse  32", "Mozartgasse 7", "2 bis rue de Fay", "Rathenaustraße 17a", "Tannenkampstraße 9a", "14 RUE DU SEMINAIRE", "41 Wyndrell Close", "Hozbauernweg 1", "18 rue des roses", "11 rue Caruel de Saint Martin", "14 alyn road", "Flat 7, The Coach Yard", "Christlgasse 6", "18 Mansel Close", "Am Waldrand 3", "106 Rue de la Pompe", "Kesonkuja 1", "Kuusmiehentie 3 f 32", "12 A rue Fontaine Saint-Lambert", "4 avenue rené caillé", "Sjöviksvägen 34", "Kirchstraße 35", "Sognevejen 300", "Im Remenfeld 4", "Lagenoord 8", "3 Chemin de la Tuilerie", "Granveien 3B", "Barer Straße 48", "ALEJE JEROZOLIMSKIE 195B", "Waldstr. 3", "4 CHESS CLOSE", "8, allée des Jardins", "Sonnleitstraße 48", "Friedrich-Engels-Ring 34", "Bremer Straße 1a", "honkasaarentie 3c", "Sommerseite 65", "5 dee valley court acrefair", "Postvägen 7F", "Gärtnerstrasse 5", "1 Heathgate", "Terschellingkade 15", "Kaiserstraße 9", "Richard Holkade 8", "Boulevard 30", "22 avenue Francis de Pressensé", "Kirkwrahe 89", "29 Avenue Road", "6 CHEYNELL WALK", "50 kan van de putstraat", "44 hector avenue", "Blankeneser Landstr 35", "28 rue cotis capel", "132 rue aristide hurbiez", "rte de Chaussy 13", "via carli 24", "Schloßplatz 23", "Alleenstrasse 34", "Schwarzburger Straße 14", "Mühlbachbogen 4", "4 avenue du saule", "Graefestr. 27", "Bayerngasse 3", "Freilichtbühnenstraße 32", "6 RUE DU PRE VERCEL", "Grünauer Allee 58", "Winterhuder Marktplatz 1", "13 Meadow Close", "9 rue Anatole France", "molværshaug 7", "Chalmersgatan 22", "Zgrupowania Żmija 3/21", "806 Chemin de Peidessalle", "Traubengäßle 8", "85 rue des Sablons", "81 RUE DENFERT ROCHEREAU N°10", "Haslirainstrasse 12a", "Helgersdorferstr.8a", "101 RUE SOLFERINO", "Benkendorfer Str. 80", "13, Rue Préfet-Comte", "reethweg 1", "Słupska 7", "Württembergallee 26", "28 Rosebank Place", "Otakarstr. 11", "Honnhammervegen 1", "5 Bis Allée Clara Schumann", "Populierenlaan 44", "1 rue des meuniers", "Brinkfeldweg 9", "33 ST LEVAN ROAD", "Greifswalderstr. 41", "163 CHEMIN DE LANUSSE", "Rathausstrasse 25", "13 rue rualménil", "315 Gathurst Road", "12 rue Laterale au Viaduc", "Unterlängenfeld 214a", "3 Culbert Ave", "Trentsedijk 12", "99, rue du faubourg Saint-Honoré", "Blumenstr. 7 B", "11 RUE ROGER MARTIN DU GARD", "Slabystr 22", "4 rue de la pie qui boit", "Mozartstr. 43", "frederiksholm kanal 26", "Via Vigevano, 14", "Walstraat 5a", "2 King Edward street", "Plißstraße 67", "Robert-Koch-Str. 18", "4 Highfield", "Pusckinstraße 21", "Korsbøenveien 293", "Radickestr.36b", "15 Rose Hill", "Vanha Talvitie 3C", "4 impasse des rossignols", "Richard-Becker-Straße 5", "5 IMPASSE JACQUES SWEBACH", "20, place galilée la porte verte apt A1.1", "Rahrdumerstrasse 6", "28 A avenue de Verdun", "Chemin du Risoux 9", "Traberweg 11", "Osterweg 35b", "5 CHEMIN DE QUINCANGROGNE", "Kranichstr. 11", "Sallandstraat 12", "4 rue des pinsons", "2180 ROUTE DU MONT", "9 esplanade Raoul Follereau", "Asternweg 14", "2 Place De La Saint Jean", "Loofhout 34", "Brücklhöhe 16", "28 avenue de la division Leclerc", "VIA INDUNO 17 B", "Gschwendt 20", "Beethovenstr. 5", "Schlankreye 57", "Im Windenfeld 3", "11 Richmond Road", "1377 bld du bois Maurin", "23 avenue des droits de", "Route du Jordil 6", "61 avenue de la République", "2 Ter rue de Gy", "Leinpfad 24", "arroyo de los pos, 4", "Langfurenstrasse 59", "Geneickener Str. 158c", "10 rue du Moulin", "Annette-Kolb-Str. 19", "Am Walperloh 19", "41, rue André Ribaud", "Storkauer Dorfstr. 19", "Bunatwiete 23", "Platz 370", "Guderhandviertel 54c", "95 allee Pierre Brossolette", "Langenbergstraße 42a", "2 lotissement les logis du verger", "Maaherrankatu 10 b2", "Hauptstraße 20", "1 rue du Révérend Père Brottier", "10 Rue Alexandre deleyre", "Majorsallen 42e", "5 rue jacques callot", "37 Moulin Road", "23 The Street", "Garnisongasse 1/17", "39 carlyle square", "De Voorstenkamp 1614", "via dell'artigianato 8", "Bispebjerg Parkalle 22", "Gutenbergstraße 3", "An der Aue 20", "kastanienallee 12", "29 Water Lane", "44 RUE DU MARECHAL JOFFRE", "17 rue Charles de Gaulle", "43 Lawn Close", "60 Western Avenue", "Hooikade 26", "Stammen 55, 2.mf., vær. 10", "PL 15", "Rübenbitze 2", "Neue Straße 10", "152, route de la Gare", "101 Castle Rock Drive", "Schwändi  28", "søskrænten 16", "Via Andrea Mantegna 62", "Schloßstr. 32-34", "Ungererstraße 65", "Lilienthaler Str. 40a", "102, boulevrad de l'europe", "2B rue du maine", "bogaerdstraat 21", "Eichhorster weg 35", "Untergasse 10", "Dammstrasse 34", "12 Glenfeshie Terrace", "Sternwartenstr. 44", "10 allée des charmilles", "Saselheider Weg 58", "Storgata 27", "Heideweg 7", "Marconi 20", "50 allee de la foret de marly", "rodheimer str 1", "Aronkatu 4", "19 rue des bordiers", "256 rue du Bécadot", "Forststrasse 24", "Lehenstr. 14", "Wartenburger Straße 27 / 33", "Schützenstr. 2", "170-171 monkton", "Bruno-Walter-Ring 22", "52 Queen Ann Road", "Zentnerstraße 34", "Bürgermeister-Renner Straße 2", "Millöckerstraße 7", "salzburger str 18", "Rua Pires Jorge, 1 - 3F", "Jupiterstraat 20", "Frankfurter Ring 10", "Mittelstrasse 16", "Trollveien 2", "Alfieri 4", "85 Hent Kerlantine", "Heltnevegen 7A", "31 Edgehill", "Bahnhofstr. 9 B", "rembrandtstraat 21", "Bertuchstr. 17", "8 rue d'helvétie", "Mergenthalerweg 13c", "3 rue de la petite Saule", "Prelluntie 137", "Alte Landstrasse 35", "Vesterbrogade 176", "Am Brink 2", "Berninastrasse 11", "Röderichstraße 59", "Abstimmungsstraße 25", "Am Steinbach 2", "Boulevard du Roi Albert II 27 - floor 20U", "Alte Annaberger Straße 10", "Aenne-Burda-Str. 1", "St. Jacober Nebenstr. 100", "8, RUE FRANCOIS VERNAY", "avenue Carton de Wiart 142", "Pfeffenhausener Straße 49", "Maintalstr. 7", "Comeniusstraße 20", "weinling 8", "Erika-Mann-Straße 23", "Hellesneset 31", "Amselgrund 24", "24 lotissement des carmes", "Altkönigstraße 15", "HANKELSTRASSE 3", "1 rue de Majorque", "Eilveser Hauptstr. 64", "2 rue Marcellin Berthelot", "Wirtschaftsweg 1", "Erich-Fried-Weg 1/4/407", "6 rue Alexandre Bachelet", "Rugmarken 45", "Champsrayés 5", "Beilsteinerstrasse 8", "22 Lotissement les tilleuls", "hasenacker 13", "Virchowstraße 49", "via Alfredo di Dio 89", "34 avenue Raymond Tribout", "2 allée du petit bois", "Denisgasse 30-34/3/4", "55 Llwynmawr. Close", "Jansgoed 14", "18, rue de la paix", "7 rue", "Slätten 1", "245 rue Jean REBOUL", "42 St John's Square", "Am Hofacker 11", "pastoor kwakmanlaan 101", "11 Spindlewood Close", "eichenstrasse 18", "Kløvervej 4", "2 bis impasse des prunelles", "turnerstr 15", "Pullacher Weg 11", "22 Hameau De L'ancienne Eglise", "Vintervägen 150", "Keltenstr. 16", "Wolsztyńska 5", "Georg-Büchner-Straße 26", "51 rue Emile Fontanier", "Maiengasse 9a", "2534-32 CHEMIN DES COUDOUNELLES", "18 rue des faussillons", "8 rue du pic de Barlonguere", "Kreittmayrstraße 14", "Cappeler Straße 21", "Holstilankuja 11", "Veerpolderstraat 101", "Fregatlaan 4", "10 rue schoenberg", "18 rue des Crocheteurs", "Värmlandsvägen 219", "Sophienstraße 9", "Schlosserstraße 36", "98 Crémille", "Obere Oese 2-4", "Seeburger Str. 26", "Chemin du Clos 13", "In den Kämpen 7", "enzenhardtplatz 6", "Rosenheimer Platz 4", "Goldweiherstr. 64", "Marienstr. 7", "Höchlistrasse 7b", "7 Rue du Faubourg", "Oldesloer Str. 165", "Auf der Halde 5", "Theophil-Wurm-Strasse 5", "11625 197th Ave NW", "Amundsenstr. 37", "Obendeich 65", "87 rue de la montée rouge", "Werner-Heisenberg-Weg 117/103", "Großbeerenstr. 15", "Poststrasse 40", "241 boulevard voltaire", "Köllnerstrasse 62", "Horner Weg 36", "Rue de Rocroi,7a", "C. Norwida 26", "Klariksentie 1 A 1", "Breslauer Str. 47", "In der Sulz 5", "Lyshøjgårdsvej 27, 2. th", "hultvägen 5a", "13, rue Richard Lenoir", "Oravistontie 95", "419 Jefferson Place", "Benno-Strauß-Straße 5 c", "22 rue du martelois", "3 rue du breuil", "Multatulihof 20", "46 RUE DULONG", "Brauerweg 52", "53 lieu dit le bourg", "621 rue Raymond Poincarré", "Kravuntie 8", "Alt-Friedrichsfelde 45", "8, allée de la Roselière", "viale san marco 66 n", "saarlandring 28", "Rheinstrasse 61", "147 avenue de nice", "Marktfeldstraße 62A", "Schloesslihalde.15d", "9 square balzac", "Via del Pomerio, 53", "Wilhelm-Pieck-Str. 8", "4 rue Margollé", "247 Chemin des Fontaines", "Bockenheimer Anlage 46", "Eynattener Str. 65-67", "Winklerstraße 22", "Hyvelvägen 8", "11, rue Nicolas Defrêcheux", "Am Spritzenhaus 5", "1 rue louis pasteur", "Norgesgade 60, 1.th", "4 rue de Voves", "103 rue des Quillers", "Tiensestraat 4", "Pestalozzistraße 9E", "Tannenweg 23B", "Hauptstrasse 190", "Bäumenstr. 6", "Calle monte de Santa Pola, 35, urbaniz. brisamar", "Marsstraat 47", "6703 NW 7th St. SAL-37721", "Ulrichsrain 9"];
    var negatives = ["Ytre Billefjord", "HQ", "Al-mazyoon mobile Al Qasimia", "les eaux vives bâtiment C", "rue de la Gare", "Hohenbrunner Str.", "Kilnatoora", "UCPA", "George Taylor & Co. (Hamilton) Ltd", "LINCOLN HALL", "The Coach House, Lodge Farm, Orlingbury Road", "les rives", "Bovis Homes. The Manor House", "Riemerlingerstraße", "Chemin de la tuilerie", "Rose Cottage", "The Grammar School at Leeds", "Fontcoussergues", "Zwanebloemweg", "Am Töppersberg", "canchunchu viejo calle la planta", "Ellers", "sarum cottage", "Aughadreena", "Electric Works", "C8, 1", "PREVINQUIERES", "East Lodge", "Peterstr.", "Icon plc", "Hastings Printing Company Ltd", "BMA Charities, BMA House", "wierbalg", "Norddeutsche Pflanzenzucht Hans-Georg Lembke KG", "Otterwischer Straße", "le diffaut", "serres le haut", "del pino", "Ruckteschellweg", "Allmendweg25G", "School of Engineering, Riverside East, Garthdee Rd", "RU Contracts Department", "47", "1", "Bryneos", "emile vandervelde", "Björkebo Forsa", "Feldbergstrasse", "Maple Barn, Canterbury Road", "Kerkauer Dorfstraße", "Lichessol", "Nucleo alla streccia", "Bel Air, Route de Vachère", "Aschener Str.", "Le bois braud", "Roter Buck", "25", "Zadelmaker", "Coop Maisonneuve", "01687 462781 loch nevis terrace", "2197G RN7", "Palmersbachweg 34b top 9"];

    var question = ["LILLA VALLGATAN 7 C LGH 1201", "Room 5 Flat 116 Heronbank North Room", "Apt 8 Bond Warehouse, The Maltings", "7bis avenue du Grand Châtelet", "Berril Lane, Unit 11 San Raphael"];


    var map = {
        'Jan Lindtstraat 10': {
            nr: "10",
            street: "Jan Lindtstraat"
        },
        'VIA DELL\'INDUSTRIA, 60': {
            nr: "60",
            street: "VIA DELL'INDUSTRIA"
        },
        'Theophil-Wurm-Strasse 5': '5',
        'Goldweiherstr. 64': '64',
        '18 rue des Crocheteurs': '18',
        'Trierer Straße 70-72': '70-72',
        'Römerstrasse 22/3': '22/3',
        'Rua dos Moinhos Nº 33, Vale de Cardosos': {
            nr: "33",
            street: "Rua dos Moinhos Nº",
            ext: "Vale de Cardosos"
        },
        'Helmholtzstr. 2-9': '2-9',
        'Benno-Strauß-Straße 5 c': '5 c',
        '4 rue de Voves': '4',
        '8, allée de la Roselière': '8',
        'Lyshøjgårdsvej 27, 2. th': {
            nr: "27",
            street: "Lyshøjgårdsvej",
            ext: "2. th"
        },
        'Rua Pires Jorge, 1 - 3F': '1 - 3F',
        'Calle monte de Santa Pola, 35, urbaniz. brisamar': {
            street: "Calle monte de Santa Pola",
            nr: "35",
            ext: "urbaniz. brisamar"
        },
        'Walburgisstr. 3': {
            street: "Walburgisstr.",
            nr: "3"
        },
        "Packstation 112": null,
        "Wilkensvej 32 4 tv": {

        },
        "via Pontara n°9": {},
        "Verdellas N-57": {},
        "Bureisarvegen 51.": {},
        //"9bis rue du 8 mai 1945": {},
        "kayerødsgade 22 st. tv.": {
            street: "kayerødsgade",
            nr: "22 st. tv."
        },
        //"Funhofweg 1a Haus 3": {},
        "foyer des jeunes travailleur, 8 rue de la manutent": {},
        "francisco villa #12": {},
        //"Leebgasse 88/2/23+24": {},
        //"B61 Montevetro, 100 Battersea Church Rd,": {},
        "Calle juan gris nº12,1A": {},
        "Batthyány Utca 10.": {},
        "Am Bruchsee12": {
            street: "Am Bruchsee",
            nr: "12"
        },
        "Kalmargade 53 1 tv": {},
        "Castroper Stra0e 196": {},
        //"Schroegera 75/79 m. 39": {},
        "Plaza Ricla nº1 4B": {}
    };


    positives.forEach(function(street) {
        it("Valid street '" + street + "'", function() {
            assert.ok(parseStreet(street));
        });
    });

    negatives.forEach(function(street) {
        it("Invalid street '" + street + "'", function() {
            assert.notOk(parseStreet(street));
        });
    });

    Object.keys(map).forEach(function(street) {

        var testObj = map[street],
            houseNumber;

        if (testObj instanceof Object) {
            houseNumber = testObj.nr
        } else {
            houseNumber = testObj
        }

        it("Check '" + street + "'", function() {
            var result = parseStreet(street);

            if (testObj === null) {
                assert.isNull(result);
            } else {
                assert.ok(result);

                if (testObj instanceof Object) {
                    for (var key in testObj) {
                        if (testObj.hasOwnProperty(key)) {
                            assert.equal(result[key], testObj[key]);
                        }
                    }
                } else {
                    assert.equal(result.nr, houseNumber);

                }
            }

        });

    });

});