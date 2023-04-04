const getTypeColor = type => {
  const normal = '#F5F5F5'
  return {
    normal,
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
    fighting: '#E6E0D4'
  }[type] || normal
}

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
  return responses.filter(response => response.status === 'fulfilled')
}

const getPokemonsType = async pokeApiResults => {
  const fulfilledUrls = await getOnlyFulfilled({ arr: pokeApiResults, func: result => fetch(result.url) })
  const promisesUrls = fulfilledUrls.map(t => t.value.json())
  const resolvedFulfilledResults = await Promise.all(promisesUrls)
  return resolvedFulfilledResults.map(resolved => resolved.types.map(t => t.type.name))
}

const getPokemonsImgs = async ids => {
  const fulfilledImgs = await getOnlyFulfilled({ arr: ids, func: id => fetch(`./assets/img/${id}.png`) })
  return fulfilledImgs.map(t => t.value.url)
}

const getPokemonsIds = pokeApiResults => pokeApiResults
  .map(({ url }) => url.split('/')[url.split('/').length - 2])

const observeLastPokemon = pokemonsObserver => {
  const lastPokemon = document.querySelector('ul').lastChild
  pokemonsObserver.observe(lastPokemon)
}

const paginationInfo = (() => {
  const limit = 15
  let offset = 0

  const getOffset = () => offset
  const getLimit = () => limit
  const incrementOffset = () => offset += limit
  
  return { getOffset, getLimit, incrementOffset }
})()

const getPokemons = async () => {
  try {
    const { getOffset, getLimit, incrementOffset } = paginationInfo
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${getOffset()}&limit=${getLimit()}`)

    if (!response.ok) {
      throw new Error('Não foi possível obter as informações')
    }

    const { results: pokeApiResults } = await response.json()
    const types = await getPokemonsType(pokeApiResults)
    const ids = getPokemonsIds(pokeApiResults)
    const imgUrls = await getPokemonsImgs(ids)
    const pokemons = ids.map((id, i) => ({ id, name: pokeApiResults[i].name, types: types[i], imgUrl: imgUrls[i] }))

    incrementOffset()
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

    if (paginationInfo.getOffset() >= 150) {
      return
    }
    
    const pokemons = await getPokemons()

    renderPokemons(pokemons)
    observeLastPokemon(pokemonsObserver)
  }, { threshold: 0.25, rootMargin: '400px' })

  observeLastPokemon(pokemonsObserver)
}

const handlePageLoad = async () => {
  const pokemons = await getPokemons()
  
  renderPokemons(pokemons)
  handleNextPokemonsRender()
}

handlePageLoad()
