const renderPokemons = pokemonsInfo => {
  const ul = document.querySelector('ul')
  const fragment = document.createDocumentFragment()

  pokemonsInfo.forEach(({ id, name, type, imgURL }) => {
    const li = document.createElement('li')
    const img = document.createElement('img')
    const nameContainer = document.createElement('p')
    const typeContainer = document.createElement('p')

    img.setAttribute('src', imgURL)

    nameContainer.textContent = `${id} ${name[0].toUpperCase()}${name.slice(1)}`
    typeContainer.textContent = type
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

const fetchPokemons = async () => {
  const promises = await getOnlyFulfilled({ arr: Array.from({ length: 15 }, (_, i) => i + 1), func: id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`) })
  const x = promises.map(o => o.value.json())
  return Promise.all(x)
}

const getPokemonsURL = ({ url }) => fetch(url)
const getPokemonsIMG = (_, i) => fetch(`https://raw.githubusercontent.com/RafaelSilva2k22/PokemonImages/main/images/${i + 1}.png`)

let counter = 15

const renderMorePokemons = async observer => {
  if (counter >= 150) {
    return
  }

  const promises = await getOnlyFulfilled({ arr: Array.from({ length: 15 }, (_, i) => counter += 1), func: id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`) })
  const x = promises.map(o => o.value.json())
  const pokemons = await Promise.all(x)
  const filteredImgs = await getOnlyFulfilled({ arr: pokemons, func: (_, i) => fetch(`https://raw.githubusercontent.com/RafaelSilva2k22/PokemonImages/main/images/${pokemons[i].id}.png`) })
  const pokemonsInfo = pokemons.map((p, i) => ({ id: p.id, name: p.name, type: p.types.map(o => o.type.name).join(' | '), imgURL: filteredImgs[i].value.url }))

  renderPokemons(pokemonsInfo)
  observer.observe(document.querySelector('ul').lastChild)
}

const handlePageLoad = async () => {
  const pokemons = await fetchPokemons()
  const filteredImgs = await getOnlyFulfilled({ arr: pokemons, func: getPokemonsIMG })
  const pokemonsInfo = pokemons.map((p, i) => ({ id: p.id, name: p.name, type: p.types.map(o => o.type.name).join(' | '), imgURL: filteredImgs[i].value.url }))

  renderPokemons(pokemonsInfo)

  const lastLiObserver = new IntersectionObserver((entries, observer) => {
    const lastPokemon = entries[0]
    
    if (!lastPokemon.isIntersecting) {
      console.log('último pokemon NÃO ESTÁ na pág')
      return
    }

    console.log('25% do último pokemon ESTÁ na pág. Renderize os próximos 15')
    renderMorePokemons(observer)
    observer.unobserve(lastPokemon.target)
  }, { threshold: 0.25, rootMargin: '100px' })

  lastLiObserver.observe(document.querySelector('ul').lastChild)
}

handlePageLoad()
