'use strict';

const Hapi = require('hapi');
const Inert = require('inert');                //for static files
const Vision = require('vision');              //template rendering
const HapiSwagger = require('hapi-swagger');     //documentation and testing API's
const Joi = require('joi');                    //validation

//database connection
var mongoose = require('mongoose');		// mongodb ORM 

//making connection with 'restdemo' database
mongoose.connect('mongodb://localhost/restdemo');         

//importing user model from 'models/user.js' file
var UserModel = require('./models/user.js');                

//creating server
const server = new Hapi.Server();                       

//connecting 
server.connection({

	port:3000,
	host:'localhost'
	
});

//Options for registering Swagger plugin
const Options = { 
	info:{
		'title':'User API Testing',       //showing this information on swagger  //localhost:port_number/documentation
	}
};

//registering the swagger plugin (use for documentation and testing purpose
//hapi-swagger is dependent on Inert and vision plugin
server.register([
	Inert,
	Vision,
	{
		'register':require('hapi-swagger'),
		'options':Options
	}],
	function(err)
	{
		if(err)
			server.log(['error'],'hapi-swagger load error:'+err)
		else
			server.log(['start'],'hapi-swagger interface loaded');
	}
);



//routes for API
//1
//route for getting all users
server.route({

	method:'GET',  
	path:'/api/user/',           //url
	config:{
		tags:['api'],                //tags enable swagger to documnet API
		description:'Get all User Data',
		notes:'Get all user Data'
	},
	handler:function(request,reply){
		UserModel.find({},function(error,data){
			
			if(error)
			{
				reply({
					statusCode:503,
					message:'Failed to get data',
					data:error
				});
			}
			else
			{
				reply({
					statusCode:200,
					message:'User Data Successfully Fetched',
					data:data
				});
			}
		});
	}
});

//2
//route for POST or adding users

server.route({
	method:'POST',
	path:'/api/user/',
	config:{
		tags:['api'],
		description:'Save User data',
		notes:'Save user Data',
		validate:{
			payload:{
				name:Joi.string().required(),       //these are paramters we get through FORM body
				age:Joi.number().required()
			}
		}
	},
	handler:function(request,reply)
	{
		//create mongodb user object to save it into db
		var user = new UserModel(request.payload);

		//call "save" method to save data into db and pass callback methods to handle error
		user.save((err)=>{
			if(err)
			{
				reply({
					statusCode:503,
					message:err
				});
			}
			else
			{
				reply({
					statusCode:201,
					message:'User Saved Succesfully'
				});
			}
		});
	}
});


//3
//get user specific data
server.route({
	method:'GET',
	path:'/api/user/{name}',
	config:{
		tags:['api'],
		description:'Get specific user data',
		notes:'Get specific user data',
		validate:{
			params:{
				name:Joi.string().required()             //these are the parameters using URL
			}
		}
	},
	handler:function(request,reply)
	{
		UserModel.find({name:request.params.name},function(error,data){
			
			if(error)
			{
				reply({
					statusCode:503,
					message:'Failed to get data',
					data:error
				});
			}
			else
			{
				if(data.length===0)
				{
					reply({
						statusCode:404,
						message:'User not found',
						data:data
					});
				}
				else
				{
					reply({
						statusCode:200,
						message:'User data successfully fetched',
						data:data
					});
				}
			}
		});
	}
});


//4
//route for updating user specific data
server.route({
	method:'PUT',
	path:'/api/user/{name}',
	config:{
		tags:['api'],
		description:'Update data of user',
	 	notes:'Update user specific data',
		validate:{
			params:{                                          //data sent in URL
				name:Joi.string().required()
			},
			payload:{                                       //values supplied by sending data through form
				name:Joi.string().required(),
				age:Joi.number().required()
			}
		}
	},
	handler:function(request,reply)
	{
			//findOneAndUpdate is a moongoose modal method to update particular id record
			UserModel.findOneAndUpdate({name:request.params.name},request.payload,function(error,data){
				if(error)
				{
					reply({
						statusCode:503,
						message:'Failed to get data',
						data:error
					});
				}
				else
				{
					reply({
						statusCode:200,
						message:'User updated successfully',
						data:data
					});
				}

			});
	}
});


//5
//route for delete a particular user
server.route({
	method:'DELETE',
	path:'/api/user/{id}',
	config:{
		tags:['api'],
		description:'Remove specific data',
		notes:'Remove specific data',
		validate:{
			params:{
				id:Joi.string().required()
			}
		}
	},
	handler:function(request,reply)
	{
		UserModel.findOneAndRemove({_id:request.params.id},function(error){
			if(error)
			{
				reply({
					statusCode:503,
					message:'Not deleted',
				});
			}
			else
			{
				reply({
					statusCode:200,
					message:'User deleted',
				});
			}
		});
	}
	
});

server.start((err)=>{
	if(err)
		throw err;
	console.log('Server is running at : '+server.info.uri);
});
