const TYPE_FILE = 'FILE';
const TYPE_FOLDER = 'FOLDER';

const structure = {
	root: {
		type: TYPE_FOLDER,
		name: 'root',
		childs: [
			{
				type: TYPE_FOLDER,
				name: 'first',
				childs: [
					{
						type: TYPE_FOLDER,
						name: 'labs',
						childs: [
							{
								type: TYPE_FILE,
								name: 'enother-lab.c' 
							}
						]
					},

					{
						type: TYPE_FOLDER,
						name: 'fk',
						childs: [
							{
								type: TYPE_FILE,
								name: 'fk.svg'
							},

							{
								type: TYPE_FILE,
								name: 'Дневник самоконтроля.docx'
							}
						]
					}
				]
			},

			{
				type: TYPE_FILE,
				name: 'some-sort.c'
			},

			{
				type: TYPE_FOLDER, 
				name: 'wallpapers',
				childs: [
					{
						type: TYPE_FILE,
						name: 'wallpapers.png'
					},

					{
						type: TYPE_FILE,
						name: 'phone-wallpapers.png'
					}
				]
			}
		]
	}
}

//Класс ошибок для отдельной обработки исключений при добавлении файла
class FileWorkError extends Error{
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
	}
}

//Основная структура представления данных в виде дерева
class Tree {
	constructor(root) {
		this.root = root;
		this.root.isHidden = false;
	}

	//Метод добавления файла по указанному пути
	addFileWithPath(path) {
		
		//Проверка на несовпадение имени создаваемого файла с уже существующими
		function isUnique(folder, name) {
			try{
				const coincidences = folder.childs.filter(value => name === value.name);
				if(coincidences.length > 0)
					throw new FileWorkError('File with the same name already exists');
				else 
					return true;

			//при возбуждении ошибки функция вернет undefined -> аналогично false	
			} catch(e) {
				if(e.name === 'FileWorkError')
					alert(e.message);
				else
					throw e;
			}

		}

		//Массив будет соответствовать пути без имени файла.
		//т.к. реализована функция поиска нужной директории
		const pathArray = [...path.split('/')];
		const nameOfFile = pathArray.pop();

		const searchedFolder = this.findFolder(this.root, pathArray);
		if(searchedFolder && isUnique(searchedFolder, nameOfFile)) {
			searchedFolder.addChild(nameOfFile, TYPE_FILE);
		}
	}

	//Метод закрытия папки по указанному пути
	hideFolder(path) {

		//Помимо закрытия самой папки рекурсивное закрытие всех внутренних
		function closeAllFoldersInThisFolder(folder) {
			for(let child of folder.childs) {
				if(child instanceof Folder) {
					closeAllFoldersInThisFolder(child);
				}
			}
			folder.close();
		}

		const targetFolder = this.findFolder(this.root, path.split('/'));
		closeAllFoldersInThisFolder(targetFolder);
	}

	openFolder(path) {
		const targetFolder = this.findFolder(this.root, path.split('/'));
		targetFolder.open();
	}

	//Функция поиска папки по пути, разбитому на компоненты
	findFolder(actualNode, actualPathItems) {
		try {
			//Проверка на итоговое совпадение с каталогом и на попадание в папку, а не в файл
			//(Массив имени пути укорачивается с каждым срабатыванием функции)
			if(actualPathItems.shift() !== actualNode.name || actualNode instanceof File)
				throw new FileWorkError('Path is not correct');

			//Проверка на совпадение в указанном каталоге, если в пути осталось только имя
			if(actualPathItems.length === 0) {
				return actualNode;
			} else {

				//Дальнейший поиск каталогов из указанного пути
				let findingName = actualPathItems[0];
				let isFinded = false;

				for(let child of actualNode.childs) {
					if(child.name === findingName) {
						isFinded = true;
						const findedFolder = this.findFolder(child, actualPathItems);
						if(findedFolder)
							return findedFolder;
					}
				}
				if(!isFinded) 
					throw new FileWorkError('Path is not correct');
			}				
		} catch(e) {
			if(e.name === 'FileWorkError') 
				alert(e.message);
			else
				throw e;
		}

	}
}

//Node и File аналогичны по структуре, однако по семантике папка наврядли должна наследоваться
//от файла. Поэтому File и Folder по своей сути являются узлами дерева, от которого и идет наследование
class Node {
	constructor(name, path) {
		this.name = name;
		this.path = path;

		//Поле необходимо для отрисовки
		this.isHidden = true;
	}
}

class File extends Node {
	constructor(name, path) {
		super(name, path);
	}
}

class Folder extends Node {
	constructor(name, path, ...childs) {
		super(name, path);
		this.childs = childs;
		this._isOpened = false;
	}
	
	getOpened() {
		return this._isOpened;
	}

	close() {
		this._isOpened = false;
		this.childs.forEach(child => child.isHidden = true);
	}
	open() {
		this._isOpened = true;
		this.childs.forEach(child => child.isHidden = false);
	}
	addChild(name, type) {
		if(type === 'FOLDER') {
			this.childs.push(new Folder(name, `${this.path}/${name}`));
			return true;
		} else if(type === 'FILE') {
			this.childs.push(new File(name, `${this.path}/${name}`));
			return true;			
		}
		return false;
	}
}

//Функция, возвращающая дерево, построенное на основе объекта
//Внутри инкапсулирована рекурсивная функция добавления подобъектов
function createTreeFromObjectStructure(structure) {

	function addChildInTree(item, path) {

		if(item.type === TYPE_FILE) 
			return new File(item.name, path);

		else if(item.type === TYPE_FOLDER){
			const allChilds = [];
			if(item.childs)
				item.childs.forEach(child => allChilds.push(addChildInTree(child, `${path}/${child.name}`)));
			return new Folder(item.name, path, ...allChilds);
		}
	}

	return new Tree(addChildInTree(structure.root, 'root'));	
}

//Отрисовка в консоли. Аналогична последующему рисованию.
//Была промежуточной для тестов, используй как хочешь
function printTree(tree) {

	function printChild(child) {
		if(!child.isHidden) {
			if(child instanceof File)
				console.log(child);
			else {
				console.group(child.name);
				for(let item of child.childs) {
					printChild(item);
				}
				console.groupEnd();
			}
		}
	}
	printChild(tree.root);
}

//Сама отрисовка
function drawTree(tree) {

	const testNode = document.getElementById('doc_tree');

	function drawChild(child) {
		if(!child.isHidden) {
			if(child instanceof File)
				return `<li data-path='${child.path}' class='file'><p>${child.name}</p></li>`;
			else {
				let html = `<ul data-path='${child.path}' class='folder'> <p>${child.name}</p>`;
				for(let item of child.childs) {
					html += drawChild(item); 
				}
				html += '</ul>';
				return html;
			}
		} else return '';
	}

	testNode.innerHTML = drawChild(tree.root);
}

//Стартовая инициализация
const tree = createTreeFromObjectStructure(structure);
drawTree(tree);



const docTree = document.getElementById('doc_tree');
const enterPath = document.getElementById('enter_path');
const enterPathButton = document.getElementById('enter_path_btn');

docTree.addEventListener(
	'click', 
	(event) => {

		//Выбирается ближайший родитель объекта (для случая, чтобы внутренний p не играл роль
		//и воспринимался как свой родитель)
		const target = event.target.closest('ul');
		if(target) {
			const path = target.dataset.path;
			const folderTarget = tree.findFolder(tree.root, path.split('/'));

			folderTarget.getOpened() ? tree.hideFolder(path) : tree.openFolder(path);

			enterPath.value = path;

			drawTree(tree);
		}
	}
)

enterPathButton.addEventListener(
	'click',
	() => {
		const path = enterPath.value;
		enterPath.value = '';
		tree.addFileWithPath(path);
		tree.hideFolder('root');
		drawTree(tree);
	}
)

