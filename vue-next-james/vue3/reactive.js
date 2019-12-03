/*
 * @Description: vue3创建响应式对象的方法实现 
 * @Author: james.zhang 
 * @Date: 2019-10-18 22:32:35 
 * @Last Modified by: james.zhang
 * @Last Modified time: 2019-10-18 23:22:51
 */
const isObject = obj => obj !== null && typeof obj === 'object'
const hasOwnProperty = (target, key) => target.hasOwnProperty(key)

const toProxy = new WeakMap(); // 弱引用映射表,如果没有被引用，垃圾回收期会自动将其回收。存放的是 源对象:代理后的对象
const toRaw = new WeakMap(); // 弱引用映射表,如果没有被引用，垃圾回收期会自动将其回收。存放的是 代理后的对象：源对象

正反缓存:
obj: observed
observed: obj

function reactive(target){
    return createReactiveObject(target)
}

function createReactiveObject(target){
    // 如果不是对象直接返回即可
    if(!isObject(target)) return target;

    let proxy = toProxy.get(target)
    // 如果源对象已经被代理过，直接返回代理结果
    if(proxy) return proxy

    // 防止对象被多次代理，直接返回源对象
    let raw = toRaw.has(target) 
    if(raw) return target;

    let baseHandle = {
        get(target, key, receiver){
            // console.log('get', key)
            let result = Reflect.get(target, key, receiver);
			track(target, key);
            return isObject(result) ? reactive(result) : result;
        },
        set(target, key, value, receiver){
            // console.log('set', key, value)
            // 怎么判断这个属性是新增还是更新
            let hasKey = hasOwnProperty(target, key)
            // 判断这个属性以前有没有
            if(!hasKey){ // 新增
                console.log('add', value)
            }else {
                console.log('update', value)
            }
            let result = Reflect.set(target, key, value, receiver);
			trigger(target, key);
            return result;
        },
        deleteProperty(target, key){
            // console.log('delete', key)
            let result = Reflect.deleteProperty(target, key);
			trigger(target, key);
            return result
        }
    }
    let observed = new Proxy(target, baseHandle)
    // 存放 源对象：代理后的对象
    toProxy.set(target, observed)
    // 存放 代理后的对象：源对象
    toRaw.set(observed, target)
    return observed;
}

// 栈结构：先进后出
let activeEffectStacks = [];

// 集合和hash表
let targetMap = new WeakMap(); 

// 如果这个tagret中的 key 变化了 我就执行数组里的方法
function track(target, key){
    // 获取最后一个
    let effect = activeEffectStacks[activeEffectStacks.length - 1];
    // 有对应关系 才创建关联 数据结构关系
    // WeakMap -> key(object):value(map) -> map -> key:value(set) -> set -> value(arr)
	
    // 有副作用函数才进行
    if(effect) {
        let depsMap = targetMap.get(target);
        if(!depsMap) targetMap.set(key, depsMap = new Map());
        let depsSet = depsMap.get(key);
        if(!depsSet) depsMap.set(key, depsSet = new Set())
        // 动态创建依赖关系
        if(!depsSet.has(effect)) depsSet.add(effect)
    }
}

// 遍历set里面的所有effect依次执行
function trigger(target, key){
    let depsMap = targetMap.get(target);
    if(depsMap) {
        let depsSet = depsMap.get(key);
        // 将当前key 对应的 effect 依次执行
        depsSet && depsSet.forEach(effect => effect());
    }   
}

// 响应式的副作用
function effect(fn) {
    // 需要把fn函数变成响应式函数
    let effect = createReactiveEffect(fn);
    // 首次需要先执行一次
    effect();
}

// 创建响应式函数
function createReactiveEffect(fn) {
    let effect = function(){
        return run(effect, fn);
    }
    return effect;
}

function run(effect, fn){
    try {
        // 将副作用函数入栈
        activeEffectStacks.push(effect)
        fn(); // vue2 利用了js是单线程的
    } finally { // 不管是否报错都会执行
        // 执行完毕后弹栈
        activeEffectStacks.pop();
    }
}

// 依赖收集，发布订阅
let reactiveObj = reactive({name: 'james'});
effect(() => { // effect 会执行两次 ,默认先执行一次 之后依赖的数据变化了 会再次执行
    console.log(reactiveObj.name); // 会调用get方法
})
reactiveObj.name = 'golderBrother'

// let reactiveObj = reactive({name: 'james'});
// reactiveObj.name; // get name
// reactiveObj.name = "golderBrother"; // set name golderBrother update golderBrother
// reactiveObj.age = 18; // set age 18 add 18
// delete reactiveObj.age; // delete age