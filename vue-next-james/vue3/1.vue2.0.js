/*
 * @Description: vue2.0的响应式实现 
 * @Author: james.zhang 
 * @Date: 2019-10-18 23:28:02 
 * @Last Modified by: james.zhang
 * @Last Modified time: 2019-10-19 10:25:15
 */

let oldPrototype = Array.prototype;

// 创建一个实例，操作实例不会影响老的
// 相当于继承 proto.__proto__ === oldPrototype
let proto = Object.create(oldPrototype);
const arrayMethods = ['shift', 'unshift', 'pop', 'push'];
arrayMethods.forEach(method => {
    // 函数劫持， 内部继续调用数组原生的方法
    proto[method] = function () {
        updateView([...arguments])
        oldPrototype[method].call(this, ...arguments)
    }
})

function hasOwnProperty(target, key){
    return target.hasOwnProperty(key)
}

// 包装成响应式的方法
function observer(target) {
    // 基本类型的数据直接返回
    if (typeof target !== 'object' || target == null) return target;
    if (Array.isArray(target)) {
        // 是数组就调用数组的原生方法更改数据
        // 相当于 target.__proto__ = proto;
        Object.setPrototypeOf(target, proto);
        // 递归遍历子元素，包装为响应式的
        for (const key in target) {
            if(hasOwnProperty(target, key)) {
                observer(target[key])
            }
        }
    } else {
        // 对象就将每个值包装为响应式的
        for (const key in target) {
            if(hasOwnProperty(target, key)) {
                defineReactive(target, key, target[key])
            }
        }
    }
}

// 定义成响应式的方法
function defineReactive(target, key, value) {
    // 深度递归target，将所有的属性值都包装成响应式对象，比如多层级的数据{a: {b: {c: {d: 1}}}
    observer(value);
    Object.defineProperty(target, key, {
        get() {
            // console.log('获取', value)
            return value
        },
        set(newValue) {
            // console.log('设置', newValue)
            //可能设置的值是个新的对象(引用地址改变了),比如obj.a = {name: 10}，就需要将这个新的引用对象({name: 10})设置成响应式的
            observer(newValue)
            updateView(newValue)
            value = newValue;
        }
    })
}

function updateView(val) {
    console.log('更新视图', val)
}

let data = {
    name: "james",
    age: [1, 2, 3],
    a: {
        b: {
            c: {
                d: 1
            }
        }
    }
};
observer(data);
// console.log(data.name);
data.name;
data.name = 'golderBrother';
data.age.push(4);