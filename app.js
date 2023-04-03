const getTypeColor = type => ({
  steel: '#f4f4f4',
  fire: '#FDDFDF',
  grass: '#DEFDE0',
  electric: '#FCF7DE',
  ice: '#DEF3FD',
  water: '#DEF3FD',
  ground: '#f4e7da',
  rock: '#d5d5d4',
  fairy: '#fceaff',
  poison: '#98d7a5',
  bug: '#f8d5a3',
  ghost: '#cac0f7',
  dragon: '#97b3e6',
  psychic: '#eaeda1',
  flying: '#F5F5F5',
  fighting: '#E6E0D4',
  normal: '#F5F5F5'
})[type] || '#F5F5F5'

const renderPokemons = pokemons => {
  const ul = document.querySelector('ul')
  const fragment = document.createDocumentFragment()
  
  pokemons.forEach(({ id, name, types, imgUrl }) => {
    const li = document.createElement('li')
    const img = document.createElement('img')
    const nameContainer = document.createElement('h2')
    const typeContainer = document.createElement('p')
    const [firstType] = types

    img.setAttribute('src', imgUrl)
    img.setAttribute('alt', name)
    img.setAttribute('class', 'card-image')
    li.setAttribute('class', `card ${firstType}`)
    li.style.setProperty('--type-color', getTypeColor(firstType))

    nameContainer.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`
    typeContainer.textContent = types.length > 1 ? types.join(' | ') : firstType
    li.append(img, nameContainer, typeContainer)
    fragment.append(li)
  })

  ul.append(fragment)
}

const getOnlyFulfilled = async ({ arr, func }) => {
  const promises = arr.map(func)
  const responses = await Promise.allSettled(promises)
  return responses.filter(r => r.status === 'fulfilled')
}

const observeLastPokemon = pokemonsObserver => {
  const lastPokemon = document.querySelector('ul').lastChild
  pokemonsObserver.observe(lastPokemon)
}

const limit = 15
let offset = 0

const getPokemons = async ({ offset, limit }) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`)

    if (!response.ok) {
      throw new Error('Não foi possível obter as informações')
    }

    const { results: pokeApiResults } = await response.json()
    const types = await getPokemonsType(pokeApiResults)
    const ids = getPokemonsIds(pokeApiResults)
    const imgUrls = await getPokemonsImgs(ids)
    const pokemons = ids.map((id, i) => ({ id, name: pokeApiResults[i].name, types: types[i], imgUrl: imgUrls[i] }))
    offset += limit

    return pokemons
  } catch (error) {
    console.log('Algo deu errado:', error)
  }
}

const handleNextPokemonsRender = () => {
  const pokemonsObserver = new IntersectionObserver(async ([lastPokemon], observer) => {
    if (!lastPokemon.isIntersecting) {
      return
    }

    observer.unobserve(lastPokemon.target)

    if (offset >= 150) {
      return
    }
    
    const pokemons = await getPokemons({ offset, limit })

    renderPokemons(pokemons)
    observeLastPokemon(pokemonsObserver)
  }, { threshold: 0.25, rootMargin: '400px' })

  observeLastPokemon(pokemonsObserver)
}

const getPokemonsType = async pokeApiResults => {
  const resultTypes = pokeApiResults.map(result => fetch(result.url))
  const settledResultTypes = await Promise.allSettled(resultTypes)
  const fulfilledResults = settledResultTypes.filter(q => q.status === 'fulfilled').map(t => t.value.json())
  const resolvedFulfilledResults = await Promise.all(fulfilledResults)
  return resolvedFulfilledResults.map(resolved => resolved.types.map(t => t.type.name))
}

const getPokemonsImgs = async ids => {
  const imgResponses = ids.map(id => fetch(`./assets/img/${id}.png`))
  const imgPromises = await Promise.allSettled(imgResponses)
  return imgPromises.filter(q => q.status === 'fulfilled').map(t => t.value.url)
}

const getPokemonsIds = pokeApiResults => pokeApiResults
  .map(({ url }) => url.split('/')[url.split('/').length - 2])

const handlePageLoad = async () => {
  const pokemons = await getPokemons({ offset, limit })

  renderPokemons(pokemons)
  handleNextPokemonsRender()
}

handlePageLoad()
