function qerror(AI,errormsg){
	this.AI=AI;
	this.errormsg=errormsg;
}
function data(x,y,size){
	this.x=x;
	this.y=y;
	this.size=size;
	this.radius=function(){
		return Math.sqrt(this.size+30);
	}
	return this;
}
function vec(x,y){
	this.x=x;
	this.y=y;
	this.len=function(){
		return Math.sqrt(this.x*this.x+this.y*this.y);
	}
	this.resize=function(len,AI){
		if(Math.abs(len)>100) throw(new qerror(AI,"Speed resize too big"));
		var q=this.len()/len;
		this.x=this.x*q;
		this.y=this.y*q;
	}
	this.crect=function(wid,hei){
		if(this.x<0) this.x=0;
		if(this.y<0) this.y=0;
		if(this.x>wid) this.x=wid;
		if(this.y>hei) this.y=hei;
	}
	return this;
}
function addVec(vec1,vec2){
	return new vec(vec1.x+vec2.x,vec1.y+vec2.y);
}
function mulVec(vec1,delta){
	return new vec(vec1.x*delta,vec1.y*delta);
}
function subVec(vec1,vec2){
	return new vec(vec1.x-vec2.x,vec1.y-vec2.y);
}
function bigger(eagerA,eagerB){
	return eagerA.data.size>eagerB.data.size;
}
function eagerData(eager){
	function data_eager(){
		return new data(eager.data.x,eager.data.y,eager.data.size);
	}
	function data_vec(){
		return new vec(eager.vec.x,eager.vec.y);
	}
	function data_AI(){
		return eager.AI;
	}
	this.AI=function(){return data_AI();}
	this.velocity=function(){return data_vec();}
	this.eager=function(){return data_eager();}
}
function eager(data,AI){
	this.AI=AI;
	this.data=data;
	this.vec=new vec(0,0);
	this.itr=function(time){
		//time in ms
		this.data.vec=addVec(mulVec(this.data.vec(),time/1000));
		this.data.vec.crect(9600,5400);
	}
	this.canEat=function(eager){
		var dist=subVec(new vec(eager.data.x,eager.data.y),new vec(this.data.x,this.data.y));
		return dist.len()<=(this.data.radius()/2);
	}
	this.eat=function(allEager,eagerID){
		if(bigger(this,allEager[eagerID]) && this.canEat(allEager[eagerID]) && allEager[eagerID].data.size){
			this.data.size+=allEager[eagerID].data.size;
			allEager[eagerID].size=0;
			if(!allEager[eagerID].AI) allEager[eagerID].reducePointCount();
		}
	}
}
function eagerCtrl(eageru){
	var EG=eageru;
	this.speed=function(vec){
		if(vec.len()>(10000/EG.data.size)) throw(new qerror(EG.AI,"Speed change too fast"));
		EG.vec=addVec(EG.vec,vec);
		if(EG.vec.len()>100) EG.vec.resize(100,EG.AI);
	}
	this.resize=function(len){
		EG.vec.resize(len,EG.AI);
	}
	this.split=function(vecx,size){
		if(vecx.len()>1000) throw(new qerror(EG.AI,"Split too far"));
		if(size>EG.data.size) throw(new qerror(EG.AI,"Split bigger than itself"));
		EG.data.size=EG.data.size-size;
		var pointNew=addVec(new vec(EG.data.x,EG.data.y),vecx);
		vecx.resize(100,EG.AI);
		var ret=new eager(new data(pointNew.x,pointNew.y,size),EG.AI);
		ret.vec=vecx;
		return ret;
	}
	this.oeError=function(msg){
		return new qerror(EG.AI,msg);
	}
}
function eagerCtrlSafe(eagerC,allEager,AIInfo){
	var hasA=1;
	function speed(vec){
		if(hasA) eagerC.speed(vec),hasA=0; else throw(eagerC.oeError("Multiple operation speed in one frame"));
	}
	function resize(vec){
		if(hasA) eagerC.resize(vec),hasA=0; else throw(eagerC.oeError("Multiple operation resize in one frame"));
	}
	function split(vecx,size){
		if(AIInfo.count>=40) throw(eagerC.oeError("Maximum number of allowed existing eagers exceeded"));
		var q=eagerC.split(vecx,size);
		++AIInfo.count;
		allEager.push(q),AIInfo.now.push(q);
	}
	this.speed=function(vec){speed(vec);}
	this.resize=function(vec){resize(vec);}
	this.split=function(vecx,size){split(vecx,size);}
}
function AIArray(allEager,AIInf){
	var length=0;
	var arr=[];
	var foreach=function(fn){
		var i=0;
		while(i<length){
			fn(new eagerCtrlSafe(arr[i],allEager,AIInf));
			++i;
		}
	}
	var lengthx=function(){
		return length;
	}
	var get=function(index){
		return new eagerCtrlSafe(arr[index],allEager,AIInf);
	}
	var push=function(q){
		++length;
		arr.push(q);
	}
	this.foreach=function(fn){foreach(fn);}
	this.length=function(){lengthx();}
	this.get=function(i){get(i);}
	this.push=function(fn){push(fn);}
}
function AIInfo(allEager){
	this.count=0;
	this.now=new AIArray(allEager,this);
}
function eagerSortSize(A,B){
	return B.data.size-A.data.size;
}
function AI(Id,fn){
	this.id=id;
	this.fn=fn;
	this.tot=0;
	this.max=0;
	this.lock=0;
	this.nxt=function(allEager,AIInfo){
		if(this.max>1200) return;
		if(this.lock) return;
		var p=new Date();
		fn(vec,AIInfo.now,allEager,null,null);
		var u=(new Date())-p;
		if(u>this.max) this.max=u;
		tot+=u;
		return u;
	}
}
function randomVec(){
	return new vec(Math.random()*9600|0,Math.random()*5400|0);
}
function none(ku){
	return ku.data.size==0;
}
var __GLOBAL_EAT_NUM=100;
function game(AIList){//a list of AI functions
	var exceptions=[];
	var AIs=[],allEagers=[];
	var bgAI=AIInfo(allEagers);
	var exceptionManager=[];
	function genDot(){
		var vecx=randomVec();
		var ret=new eager(new data(vecx.x,vecx.y,(Math.random()*3|0)+1),0);
		ret.reducePointCount=function(){
			--bgAI.count;
		}
	}
	for(var i=0;i<AIList.length;++i){
		AIs.push(i+1,new AI(AIList));
		var a=randomVec();
		allEagers.push(new eager(new data(a.x,a.y,10),i+1));
	}
	this.nxt=function(){
		var infos=[],eagers=[];
		for(var i=0;i<AIs.length;++i) infos.push(new AIInfo(allEagers));
		for(var i=0;i<allEagers;++i){
			if(allEagers[i].AI){
				infos[allEagers[i].AI-1].now.push(new eagerCtrl(allEagers[i]));
			}
			eagers.push(eagerData(allEagers[i]));
		}
		for(var i=0;i<AIs.length;++i){
			try{
				AIs[i].nxt(eagers,infos[i]);
			}catch(e){
				exceptions.push(e);
				AIs[e.AI-1].lock=1;
				for(var j=0;j<exceptionManager.length;++j){
					exceptionManager[j](e);
				}
			}
		}
		for(var i=0;i<allEagers.length;++i){
			allEagers[i].itr();
		}
		allEagers.sort(eagerSortSize);
		for(var i=0;i<allEagers.length;++i){
			for(var j=i;j<allEagers.length;++j){
				allEagers[i].eat(allEagers,j);
			}
		}
		allEagers.sort(eagerSortSize);
		var qu=new eager(new data(0,0,0),0);
		while(allEagers.length && none(qu=allEagers.pop()));
		if(!none(qu)) allEagers.push(qu);
		while(bgAI.count<__GLOBAL_EAT_NUM) ++bgAI.count,allEagers.push(genDot());
	}
	this.registerExceptionManager=function(fn){exceptionManager.push(fn);}
}
