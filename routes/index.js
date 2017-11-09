var express = require('express');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(__dirname+'/public'));

var router = express.Router();
router.use(bodyParser.urlencoded({extended:false}));

// MySQL Connect
var mysql = require('mysql');
var connection = mysql.createConnection
({
  	  host     : 'localhost'
  	, user     : 'root'
  	, password : 'test1234'
  	, database : 'Healthcheck'
});

connection.connect();

/* GET home page. */
router.get('/', function(req, res, next)
{
  	res.render('index', { title: 'Health' });
});

// 신체정보(사용자) 등록
router.post('/user/save', function(req, res)
{
	var parm_date = req.body.date;

	connection.query('insert into users(date, name, sex, age, height, weight, waist, hip) values (?, ?, ?, ?, ?, ?, ?, ?)'
	, [parm_date, req.body.name, req.body.sex, req.body.age, req.body.height, req.body.weight, req.body.waist, req.body.hip]
	, function(err, result)
	{
		if(err) res.send(JSON.stringify({result: false}));
		else res.send(JSON.stringify({result: true}));
	});
});

// 신체정보 조회
router.get('/user/inquiry/:id', function(req, res) 
{
	connection.query('select * from users where id=?', [req.params.id], function(err, results, fields)
	{
		if(err)
		{
			res.send(JSON.stringify(err));
		}
		else
		{
			if(results.length > 0) res.send(JSON.stringify(results[0]));
			else res.send(JSON.stringify({}));
		}
	});
});

// 신체정보 전체조회
router.get('/user/list', function(req, res)
{
	connection.query('select id, date, name, sex, age, height, weight, waist, hip from users order by id desc',
	function(err, results, fields)
	{
		if(err) res.send(JSON.stringify(err));
		else res.send(JSON.stringify({result: results}));
	});
});

// 신체정보 수정
router.put('/user/update/:id', function(req, res)
{
	connection.query('update users set name=?, sex=?, age=?, height=?, weight=?, waist=?, hip=? where id=?'
	, [req.body.name, req.body.sex, req.body.age, req.body.height, req.body.weight, req.body.waist, req.body.hip, req.params.id]
	, function(err, result)
	{
		if(err) res.send(JSON.stringify({result:false}));
		else res.send(JSON.stringify({result:true}));
	});
});

// 신체정보 삭제
router.delete('/user/delete/:id', function(req, res)
{
	connection.query('delete from users where id=?', [req.params.id], function(err, result)
	{
		if(err) res.send(JSON.stringify({result:false}));
		else res.send(JSON.stringify({result:true}));
	});
});

// BMI(신체질량지수) 측정
router.post('/user/body/bmi', function(req, res)
{
	var height = req.body.height;
	var weight = req.body.weight;

	//체중 / ((키/100) * (키/100))
	var bmi = weight / ((height/100) * (height/100));
	var obestyChk;

	if(bmi < 18.5) obestyChk = "저체중";
	else if(bmi >= 18.5 && bmi < 23) obestyChk = "정상";
	else if(bmi >= 23 && bmi < 25) obestyChk = "과체중";
	else if(bmi >= 25 && bmi < 30) obestyChk = "비만";
	else if(bmi >= 30) obestyChk = "고도비만";

	res.send(JSON.stringify({result: true, height: height, weight: weight, bmi: bmi.toFixed(2), obestyChk: obestyChk}));
});

// WHR(복부비만) 측정
router.post('/user/body/whr', function(req, res)
{
	var waist = req.body.waist;
	var hip = req.body.hip;
	var sex = req.body.sex;

	//(허리둘레/엉덩이둘레)
	var whr = waist / hip;
	var whrChk;

	if(sex == 1)
	{
		if(whr >= 1.0) whrChk = '복부비만';
		else whrChk = "정상";
	}
	else if(sex == 2)
	{
		if(whr >= 0.9) whrChk = '복부비만';
		else whrChk = "정상";
	}

	res.send(JSON.stringify({result: true, waist: waist, hip: hip, whr: whr.toFixed(2), whrChk: whrChk}));
});

// 표준체중 및 비만도 측정
router.post('/user/body/obesty', function(req, res)
{
	var height = req.body.height;
	var weight = req.body.weight;
	var sex = req.body.sex;
	
	var avrWeight;
	var obesty;
	var obestyChk;
	var minusWeight;

	// 표준체중 계산
	if(sex == '1') avrWeight = (height * 0.01) * (height * 0.01) * 22;
	else avrWeight = (height * 0.01) * (height * 0.01) * 21;

	minusWeight = weight - avrWeight;

	//비만도 -> (현재체중/표준체중)*100
	obesty = (weight / avrWeight) * 100;

	if(obesty < 90) obestyChk = "체중부족";
	else if(obesty >= 90 && obesty <= 110) obestyChk = "정상";
	else if(obesty >= 111 && obesty <= 120) obestyChk = "체중과다";
	else obestyChk = "비만";

	res.send(JSON.stringify({result: true, avrWeight: avrWeight.toFixed(2), obesty: obesty.toFixed(2), obestyChk: obestyChk,
		minusWeight: minusWeight.toFixed(2)}));
});

// 체지방률/기초대사량 측정
router.post('/user/body/fat', function(req, res)
{
	var sex = req.body.sex;
	var age = req.body.age;
	var height = req.body.height;
	var weight = req.body.weight;

	var fatLoss; //제지방량
	var fatMass; //체지방량
	var fatLossRate; //제지방률
	var fatMassRate; //체지방률
	var basicMetablsm; //기초대사량

	// 제지방량 계산
	if(sex == "1") fatLoss = (1.10 * weight) - (128 * ((weight*weight) / (height*height)));
	else if(sex == "2") fatLoss = (1.07 * weight) - (128 * ((weight*weight) / (height*height)));
	else fatLoss = "0"

	// 체지방량 계산
	if(sex == "1" || sex == "2") fatMass = weight - fatLoss;
	else fatMass = "0";

	// 제지방률(%) 계산
	if(sex == "1" || sex == "2") fatLossRate = (fatLoss * 100) / weight;
	else fatMass = "0";

	// 체지방률(%) 계산
	if(sex == "1" || sex == "2") fatMassRate = (fatMass * 100) / weight;
	else fatMass = "0";

	// 기초대사량(kcal) 계산
	if(sex == "1") basicMetablsm = 66.47 + (13.75 * weight) + (5 * height) - (6.76 * age);
	else if(sex == "2") basicMetablsm = 65.51 + (9.56 * weight) + (1.85 * height) - (4.68 * age);
	else basicMetablsm =  "0";

	res.send(JSON.stringify({result: true, age: age, height: height, weight: weight,
		fatLoss: fatLoss.toFixed(2), fatMass: fatMass.toFixed(2), fatLossRate: fatLossRate.toFixed(2),
		fatMassRate: fatMassRate.toFixed(2), basicMetablsm: basicMetablsm.toFixed(2)}));
});

module.exports = router;