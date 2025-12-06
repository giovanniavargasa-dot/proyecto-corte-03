// Lógica de lista enlazada para gestionar la cola de pedidos
class Node {
	constructor(turno, cliente, items) {
		this.turno = turno;
		this.cliente = cliente;
		this.items = items; // array de {nombre, cantidad}
		this.next = null;
	}
}

class LinkedList {
	constructor() {
		this.head = null;
		this.tail = null;
		this._size = 0;
		this._nextTurn = 1;
	}

	enqueue(cliente, items) {
		const turno = this._nextTurn++;
		const node = new Node(turno, cliente, items);
		if (!this.head) {
			this.head = node;
			this.tail = node;
		} else {
			this.tail.next = node;
			this.tail = node;
		}
		this._size++;
		return node;
	}

	dequeue() {
		if (!this.head) return null;
		const node = this.head;
		this.head = this.head.next;
		if (!this.head) this.tail = null;
		this._size--;
		return node;
	}

	findByTurn(turno) {
		let cur = this.head;
		while (cur) {
			if (cur.turno === turno) return cur;
			cur = cur.next;
		}
		return null;
	}

	findByName(name) {
		let cur = this.head;
		const results = [];
		while (cur) {
			if (cur.cliente && cur.cliente.toLowerCase().includes(name.toLowerCase())) results.push(cur);
			cur = cur.next;
		}
		return results;
	}

	removeByTurn(turno) {
		if (!this.head) return null;
		if (this.head.turno === turno) return this.dequeue();
		let prev = this.head;
		let cur = this.head.next;
		while (cur) {
			if (cur.turno === turno) {
				prev.next = cur.next;
				if (cur === this.tail) this.tail = prev;
				this._size--;
				return cur;
			}
			prev = cur;
			cur = cur.next;
		}
		return null;
	}

	toArray() {
		const arr = [];
		let cur = this.head;
		while (cur) {
			arr.push(cur);
			cur = cur.next;
		}
		return arr;
	}

	size() { return this._size; }
}

// Datos de las opciones de helado (se usan las imágenes de frontend/img)
const OPCIONES = [
	{ id: 1, nombre: 'Fresa Radiante', img: 'frontend/img/opcion-helado-1.jpg' },
	{ id: 2, nombre: 'Naranja Solar', img: 'frontend/img/opcion-helado-2.jpg' },
	{ id: 3, nombre: 'Mora del Bosque', img: 'frontend/img/opcion-helado-3.jpg' },
	{ id: 4, nombre: 'Chicle Mágico', img: 'frontend/img/opcion-helado-4.jpg' },
	{ id: 5, nombre: 'Mandarina Feliz', img: 'frontend/img/opcion-helado-5.jpg' },
	{ id: 6, nombre: 'Limón Eléctrico', img: 'frontend/img/opcion-helado-6.jpg' },
];

const lista = new LinkedList();

// --- Helpers DOM
function qs(id) { return document.getElementById(id); }

function renderOpciones() {
	const cont = qs('opcionesHelado');
	cont.innerHTML = '';
	OPCIONES.forEach(op => {
		const div = document.createElement('div');
		div.className = 'helado-opcion';
		div.innerHTML = `
			<img src="${op.img}" alt="${op.nombre}" >
			<div class="meta">
				<div><strong>${op.nombre}</strong></div>
				<label>Cantidad <input type="number" min="0" value="0" data-id="${op.id}" class="cantidad"></label>
			</div>
		`;
		cont.appendChild(div);
	});
}

function leerSeleccion() {
	const cantidades = Array.from(document.querySelectorAll('.cantidad'));
	const items = [];
	cantidades.forEach(inp => {
		const qty = parseInt(inp.value) || 0;
		if (qty > 0) {
			const id = parseInt(inp.dataset.id, 10);
			const opt = OPCIONES.find(o => o.id === id);
			items.push({ nombre: opt.nombre, cantidad: qty });
		}
	});
	return items;
}

function resetForm() {
	qs('clienteNombre').value = '';
	document.querySelectorAll('.cantidad').forEach(i => i.value = 0);
}

function renderQueue() {
	const ul = qs('listaTurnos');
	ul.innerHTML = '';
	const currentTurn = lista.head ? lista.head.turno : null;
	lista.toArray().forEach(node => {
		const li = document.createElement('li');
		li.className = 'turno-item';
		if (currentTurn === node.turno) li.classList.add('turno-actual-item');
		li.innerHTML = `<div><strong>#${node.turno} - ${escapeHtml(node.cliente)}</strong><div class="items">${formatItems(node.items)}</div></div>
			<div><button data-turno="${node.turno}" class="btn-eliminar-inline">Eliminar</button></div>`;
		ul.appendChild(li);
	});
	// añadir listeners para eliminar inline
	Array.from(document.querySelectorAll('.btn-eliminar-inline')).forEach(b => b.addEventListener('click', (e) => {
		const turno = parseInt(e.currentTarget.dataset.turno, 10);
		lista.removeByTurn(turno);
		renderQueue();
	}));
	updateTurnoActual();
}

function formatItems(items) {
	if (!items || items.length === 0) return '<em>Sin items</em>';
	return items.map(it => `${it.nombre} x${it.cantidad}`).join(' — ');
}

function escapeHtml(str) {
	if (!str) return '';
	return str.replace(/[&<>"]+/g, function (s) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[s]; });
}

function updateTurnoActual() {
	const el = qs('turnoActual');
	if (!el) return;
	if (lista.head) el.textContent = `TURNO ACTUAL: #${lista.head.turno}`;
	else el.textContent = 'TURNO ACTUAL: -';
}

// --- Acciones de los botones
function insertarPedido() {
	const nombre = qs('clienteNombre').value.trim();
	if (!nombre) { alert('Ingrese el nombre del cliente.'); return; }
	const items = leerSeleccion();
	if (items.length === 0) { if(!confirm('No seleccionó items. Desea insertar igualmente?')) return; }
	const node = lista.enqueue(nombre, items);
	resetForm();
	renderQueue();
	alert(`Pedido insertado con turno #${node.turno}`);
}

function atenderSiguiente() {
	const node = lista.dequeue();
	if (!node) { alert('No hay pedidos en la cola.'); return; }
	renderQueue();
	alert(`Atendiendo turno #${node.turno} - ${node.cliente}`);
}

function buscarPedido() {
	const turnoVal = parseInt(qs('buscarTurno').value, 10);
	const out = qs('resultadoBusqueda');
	out.innerHTML = '';
	if (turnoVal) {
		const found = lista.findByTurn(turnoVal);
		out.innerHTML = found ? `<strong>#${found.turno} - ${escapeHtml(found.cliente)}</strong><div class="items">${formatItems(found.items)}</div>` : 'No se encontró el turno';
		return;
	}
	out.innerHTML = 'Ingrese un número de turno para buscar.';
}

function eliminarPedido() {
	const turnoVal = parseInt(qs('buscarTurno').value, 10);
	if (!turnoVal) { alert('Ingrese el número de turno a eliminar.'); return; }
	const rem = lista.removeByTurn(turnoVal);
	if (!rem) { alert('No se encontró el turno para eliminar.'); return; }
	renderQueue();
	alert(`Turno #${rem.turno} eliminado.`);
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
	renderOpciones();
	renderQueue();
	qs('btnInsertar').addEventListener('click', insertarPedido);
	qs('btnAtender').addEventListener('click', atenderSiguiente);
	qs('btnBuscar').addEventListener('click', buscarPedido);
	qs('btnEliminar').addEventListener('click', eliminarPedido);
});

