// Arreglo principal: aquí se guardan los usuarios mientras la página está abierta.
let usuarios = [];
let idEnEdicion = null;

const formulario = document.querySelector('#formulario');
const campoId = document.querySelector('#id');
const campoNombre = document.querySelector('#nombre');
const campoCorreo = document.querySelector('#correo');
const campoCiudad = document.querySelector('#ciudad');
const campoBuscar = document.querySelector('#buscar');
const listaUsuarios = document.querySelector('#lista-usuarios');
const mensaje = document.querySelector('#mensaje');
const cantidad = document.querySelector('#cantidad');
const botonEnviar = document.querySelector('#boton-enviar');
const botonCancelar = document.querySelector('#boton-cancelar');
const tituloFormulario = document.querySelector('#formulario-titulo');

// Evita que los datos escritos por una persona se interpreten como etiquetas HTML.
const protegerTexto = (texto) => String(texto).replace(/[&<>"']/g, (caracter) => {
  const entidades = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return entidades[caracter];
});

const mostrarMensaje = (texto, esError = false) => {
  mensaje.textContent = texto;
  mensaje.classList.toggle('error', esError);
};

// Dibuja la tabla usando solo los usuarios que coinciden con la búsqueda.
const mostrarUsuarios = () => {
  const busqueda = campoBuscar.value.trim().toLowerCase();
  const usuariosFiltrados = usuarios.filter(({ nombre }) => nombre.toLowerCase().includes(busqueda));

  if (usuariosFiltrados.length === 0) {
    listaUsuarios.innerHTML = '<tr><td colspan="5">No hay usuarios para mostrar.</td></tr>';
  } else {
    listaUsuarios.innerHTML = usuariosFiltrados.map(({ id, nombre, correo, ciudad }) => `
      <tr>
        <td>${protegerTexto(id)}</td>
        <td>${protegerTexto(nombre)}</td>
        <td>${protegerTexto(correo)}</td>
        <td>${protegerTexto(ciudad)}</td>
        <td>
          <button type="button" data-accion="editar" data-id="${protegerTexto(id)}">Editar</button>
          <button type="button" class="boton-eliminar" data-accion="eliminar" data-id="${protegerTexto(id)}">Eliminar</button>
        </td>
      </tr>`).join('');
  }

  cantidad.textContent = `Mostrando ${usuariosFiltrados.length} de ${usuarios.length} usuarios.`;
};

// Muestra el arreglo completo en la consola cada vez que cambia la lista.
const imprimirUsuarios = () => {
  console.log(JSON.stringify(usuarios, null, 2));
};

const limpiarFormulario = () => {
  formulario.reset();
  idEnEdicion = null;
  campoId.disabled = false;
  botonEnviar.textContent = 'Agregar';
  tituloFormulario.textContent = 'Agregar usuario';
  botonCancelar.hidden = true;
};

// Obtiene los usuarios de la API y adapta sus propiedades al formato del proyecto.
const cargarUsuarios = async () => {
  mostrarMensaje('Cargando...');

  try {
    const respuesta = await fetch('https://jsonplaceholder.typicode.com/users');
    if (!respuesta.ok) {
      throw new Error('La respuesta de la API no fue correcta.');
    }

    const datos = await respuesta.json();
    usuarios = datos.map(({ id, name, email, address: { city } }) => ({
      id: Number(id),
      nombre: name,
      correo: email,
      ciudad: city,
    }));

    mostrarUsuarios();
    imprimirUsuarios();
    mostrarMensaje(`Se cargaron ${usuarios.length} usuarios.`);
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    usuarios = [];
    mostrarUsuarios();
    mostrarMensaje('No se pudieron cargar los usuarios. Revisa tu conexión e inténtalo de nuevo.', true);
  }
};

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();

  // Un bucle comprueba que ningún campo obligatorio esté vacío.
  const campos = [campoId, campoNombre, campoCorreo, campoCiudad];
  for (const campo of campos) {
    if (!campo.value.trim()) {
      mostrarMensaje('Completa todos los campos.', true);
      campo.focus();
      return;
    }
  }

  const id = Number(campoId.value);
  if (!Number.isFinite(id) || !Number.isInteger(id)) {
    mostrarMensaje('El ID debe ser un número entero.', true);
    campoId.focus();
    return;
  }

  if (!campoCorreo.value.includes('@')) {
    mostrarMensaje('El correo debe contener el símbolo @.', true);
    campoCorreo.focus();
    return;
  }

  if (idEnEdicion === null && usuarios.some((usuario) => usuario.id === id)) {
    mostrarMensaje(`Ya existe un usuario con el id ${id}.`, true);
    campoId.focus();
    return;
  }

  const usuario = {
    id,
    nombre: campoNombre.value.trim(),
    correo: campoCorreo.value.trim(),
    ciudad: campoCiudad.value.trim(),
  };

  let operacion;
  if (idEnEdicion !== null) {
    usuarios = usuarios.map((actual) => actual.id === idEnEdicion ? usuario : actual);
    operacion = 'modificar';
  } else {
    usuarios.push(usuario);
    operacion = 'agregar';
  }

  // El mensaje depende del resultado de la operación.
  switch (operacion) {
    case 'modificar':
      mostrarMensaje(`Se actualizaron los datos de ${usuario.nombre}.`);
      break;
    default:
      mostrarMensaje(`Se agregó a ${usuario.nombre}.`);
  }

  imprimirUsuarios();
  mostrarUsuarios();
  limpiarFormulario();
});

// Un solo evento click en tbody atiende los botones de todas las filas.
listaUsuarios.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const usuario = usuarios.find((elemento) => elemento.id === id);
  if (!usuario) return;

  if (boton.dataset.accion === 'editar') {
    campoId.value = usuario.id;
    campoNombre.value = usuario.nombre;
    campoCorreo.value = usuario.correo;
    campoCiudad.value = usuario.ciudad;
    idEnEdicion = usuario.id;
    campoId.disabled = true;
    botonEnviar.textContent = 'Guardar cambios';
    tituloFormulario.textContent = 'Editar usuario';
    botonCancelar.hidden = false;
    mostrarMensaje(`Editando a ${usuario.nombre}.`);
    campoNombre.focus();
    return;
  }

  if (boton.dataset.accion === 'eliminar') {
    const confirmar = window.confirm(`¿Deseas eliminar a ${usuario.nombre}?`);
    if (!confirmar) return;

    usuarios = usuarios.filter((elemento) => elemento.id !== id);
    if (idEnEdicion === id) limpiarFormulario();
    imprimirUsuarios();
    mostrarUsuarios();
    mostrarMensaje(`Se eliminó a ${usuario.nombre}.`);
  }
});

campoBuscar.addEventListener('input', mostrarUsuarios);

botonCancelar.addEventListener('click', () => {
  limpiarFormulario();
  mostrarMensaje('Se canceló la edición.');
});

cargarUsuarios();
