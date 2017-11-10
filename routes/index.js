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
	connection.query('select id, date, name, sex, age, height, weight, waist, hip, avrWeight, obstObestyChk, bmi, whr, fatMass, fatMassRate, fatLossRate, basicMetablsm from users order by id desc',
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
router.post('/user/body/bmi/:id', function(req, res)
{
	var height = req.body.height;
	var weight = req.body.weight;

	var id = req.params.id;

	//체중 / ((키/100) * (키/100))
	var bmi = weight / ((height/100) * (height/100));
	var obestyChk;

	if(bmi < 18.5) obestyChk = "저체중";
	else if(bmi >= 18.5 && bmi < 23) obestyChk = "정상";
	else if(bmi >= 23 && bmi < 25) obestyChk = "과체중";
	else if(bmi >= 25 && bmi < 30) obestyChk = "비만";
	else if(bmi >= 30) obestyChk = "고도비만";

	res.send(JSON.stringify({result: true, id: id, height: height, weight: weight, bmi: bmi.toFixed(2), obestyChk: obestyChk}));
});

// BMI(신체질량지수) 저장(수정)
router.put('/user/bmi/update/:id', function(req, res)
{
	connection.query('update users set bmi=?, bmiObestyChk=? where id=?'
	, [req.body.bmi, req.body.bmiObestyChk, req.params.id]
	, function(err, result)
	{
		if(err) res.send(JSON.stringify({result:false}));
		else res.send(JSON.stringify({result:true}));
	});
});

// WHR(복부비만) 측정
router.post('/user/body/whr/:id', function(req, res)
{
	var waist = req.body.waist;
	var hip = req.body.hip;
	var sex = req.body.sex;

	var id = req.params.id;

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

	res.send(JSON.stringify({result: true, id: id, waist: waist, hip: hip, whr: whr.toFixed(2), whrChk: whrChk}));
});

// WHR(복부비만) 저장(수정)
router.put('/user/whr/update/:id', function(req, res)
{
	connection.query('update users set whr=?, whrChk=? where id=?'
	, [req.body.whr, req.body.whrChk, req.params.id]
	, function(err, result)
	{
		if(err) res.send(JSON.stringify({result:false}));
		else res.send(JSON.stringify({result:true}));
	});
});

// 표준체중 및 비만도 측정
router.post('/user/body/obesty/:id', function(req, res)
{
	var height = req.body.height;
	var weight = req.body.weight;
	var sex = req.body.sex;

	var id = req.params.id;
	
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

	res.send(JSON.stringify({result: true, id: id, avrWeight: avrWeight.toFixed(2), obesty: obesty.toFixed(2), obestyChk: obestyChk,
		minusWeight: minusWeight.toFixed(2)}));
});

// 표준체중 및 비만도 저장(수정)
router.put('/user/obesty/update/:id', function(req, res)
{
	connection.query('update users set avrWeight=?, obesty=?, obstObestyChk=? where id=?'
	, [req.body.avrWeight, req.body.obesty, req.body.obestyChk, req.params.id]
	, function(err, result)
	{
		if(err) res.send(JSON.stringify({result: false}));
		else res.send(JSON.stringify({result: true, id: req.params.id}));
	});
});

// 체지방률/기초대사량 측정
router.post('/user/body/fat/:id', function(req, res)
{
	var sex = req.body.sex;
	var age = req.body.age;
	var height = req.body.height;
	var weight = req.body.weight;

	var id = req.params.id;

	var fatLoss; //제지방량
	var fatMass; //체지방량
	var fatLossRate; //제지방률
	var fatMassRate; //체지방률
	var fatMassCheck; //체지방률 결과
	var basicMetablsm; //기초대사량
	var bascMtsmCheck; //기초대사량 결과

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

	// 체지방률(%) 결과
	if(sex == "1")
	{
		if(fatMassRate < 12) fatMassCheck = "저체중";
		else if(fatMassRate >= 12 && fatMassRate < 18) fatMassCheck = "표준";
		else if(fatMassRate >= 18 && fatMassRate < 23) fatMassCheck = "과체중";
		else if(fatMassRate >= 23 && fatMassRate < 28) fatMassCheck = "비만";
		else if(fatMassRate >= 28) fatMassCheck = "고도비만";
	}
	else if(sex == "2")
	{
		if(fatMassRate < 22) fatMassCheck = "저체중";
		else if(fatMassRate >= 22 && fatMassRate < 28) fatMassCheck = "표준";
		else if(fatMassRate >= 28 && fatMassRate < 35) fatMassCheck = "과체중";
		else if(fatMassRate >= 36 && fatMassRate < 40) fatMassCheck = "비만";
		else if(fatMassRate >= 41) fatMassCheck = "고도비만";
	}
	else
	{
		fatMassCheck = "평가불가";
	}

	// 기초대사량(kcal) 계산
	if(sex == "1") basicMetablsm = 66.47 + (13.75 * weight) + (5 * height) - (6.76 * age);
	else if(sex == "2") basicMetablsm = 65.51 + (9.56 * weight) + (1.85 * height) - (4.68 * age);
	else basicMetablsm =  "0";

	if(sex == "1")
	{
		if(age >= 20 && age <= 29)
		{
			if(basicMetablsm < (1728 - 368.2)) bascMtsmCheck = "적정수준 이하";
			else if(basicMetablsm >= (1728 - 368.2) && basicMetablsm <= (1728 + 368.2)) bascMtsmCheck = "적정수준";
			else bascMtsmCheck = "적정수준 이상";
		}
		else if(age >= 30 && age <= 49)
		{
			if(basicMetablsm < (1669.5 - 302.1)) bascMtsmCheck = "적정수준 이하";
			else if(basicMetablsm >= (1669.5 - 302.1) && basicMetablsm <= (1669.5 - 302.1)) bascMtsmCheck = "적정수준";
			else bascMtsmCheck = "적정수준 이상";
		}
		else if(age >= 50 && age <= 64)
		{
			if(basicMetablsm < (1493.8 - 315.3)) bascMtsmCheck = "적정수준 이하";
			else if(basicMetablsm >= (1493.8 - 315.3) && basicMetablsm <= (1493.8 - 315.3)) bascMtsmCheck = "적정수준";
			else bascMtsmCheck = "적정수준 이상";
		}
		else
		{
			bascMtsmCheck = "평가불가";
		}
	}
	else if(sex == "2")
	{
		if(age >= 20 && age <= 29)
		{
			if(basicMetablsm < (1311.5 - 233.0)) bascMtsmCheck = "적정수준 이하";
			else if(basicMetablsm >= (1311.5 - 233.0) && basicMetablsm <= (1311.5 - 233.0)) bascMtsmCheck = "적정수준";
			else bascMtsmCheck = "적정수준 이상";
		}
		else if(age >= 30 && age <= 49)
		{
			if(basicMetablsm < (1316.8 - 225.9)) bascMtsmCheck = "적정수준 이하";
			else if(basicMetablsm >= (1316.8 - 225.9) && basicMetablsm <= (1316.8 - 225.9)) bascMtsmCheck = "적정수준";
			else bascMtsmCheck = "적정수준 이상";
		}
		else if(age >= 50 && age <= 64)
		{
			if(basicMetablsm < (1252.5 - 228.6)) bascMtsmCheck = "적정수준 이하";
			else if(basicMetablsm >= (1252.5 - 228.6) && basicMetablsm <= (1252.5 - 228.6)) bascMtsmCheck = "적정수준";
			else bascMtsmCheck = "적정수준 이상";
		}
		else
		{
			bascMtsmCheck = "평가불가";
		}
	}
	else
	{
		bascMtsmCheck = "평가불가";
	}

	res.send(JSON.stringify({result: true, id: id, age: age, height: height, weight: weight,
		fatLoss: fatLoss.toFixed(2), fatMass: fatMass.toFixed(2), fatLossRate: fatLossRate.toFixed(2),
		fatMassRate: fatMassRate.toFixed(2), basicMetablsm: basicMetablsm.toFixed(2),
		fatMassCheck: fatMassCheck, bascMtsmCheck: bascMtsmCheck}));
});

// 체지방률/기초대사량 저장(수정)
router.put('/user/fat/update/:id', function(req, res)
{
	connection.query('update users set fatLoss=?, fatMass=?, fatLossRate=?, fatMassRate=?, basicMetablsm=?, fatMassChk=?, bascMtsmChk=? where id=?'
	, [req.body.fatLoss, req.body.fatMass, req.body.fatLossRate, req.body.fatMassRate, req.body.basicMetablsm, req.body.fatMassCheck, req.body.bascMtsmCheck, req.params.id]
	, function(err, result)
	{
		if(err) res.send(JSON.stringify({result:false}));
		else res.send(JSON.stringify({result:true}));
	});
});

module.exports = router;