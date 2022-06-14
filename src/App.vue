<template>
    <div id="app">
        <nav>
            <h1>Moje mini trello</h1>
            <p>
                Filtry:
                <button>Wszyscy członkowie</button>
                <button>Wszystkie tagi</button>
            </p>
        </nav>
        <div class="lists__container">
            <h4 class="lists__container__title">TODO</h4>
            <Container
                class="list"
                :group-name="'task-list'"
                @drop="onDrop($event, 'todo')"
                :get-child-payload="(ix) => getChildPayload(ix, 'todo')"
            >
                <Draggable v-for="task in todoTasks" :key="task.id">
                    <div class="task">
                        {{ task.name }}
                        <p>status: {{ task.status }}</p>
                    </div>
                </Draggable>
            </Container>

            <h4 class="lists__container__title">IN PROGRESS</h4>
            <Container
                class="list"
                :group-name="'task-list'"
                @drop="onDrop($event, 'in_progress')"
                :get-child-payload="(ix) => getChildPayload(ix, 'in_progress')"
            >
                <Draggable v-for="task in inProgressTasks" :key="task.id">
                    <div class="task">
                        {{ task.name }}
                        <p>status: {{ task.status }}</p>
                    </div>
                </Draggable>
            </Container>

            <h4 class="lists__container__title">DONE</h4>
            <Container
                class="list"
                :group-name="'task-list'"
                @drop="onDrop($event, 'done')"
                :get-child-payload="(ix) => getChildPayload(ix, 'done')"
            >
                <Draggable v-for="task in doneTasks" :key="task.id">
                    <div class="task">
                        {{ task.name }}
                        <p>status: {{ task.status }}</p>
                    </div>
                </Draggable>
            </Container>
        </div>
    </div>
</template>

<script>
import { Container, Draggable } from 'vue-smooth-dnd';

export default {
    name: 'app',
    components: {
        Container,
        Draggable,
    },

    computed: {
        //* filtrujemy wszystkie elementy ze statusem 'todo'
        todoTasks() {
            return this.$store.getters.getTasksByStatus('todo');
        },

        //* filtrujemy wszystkie elementy ze statusem 'in_progress'
        inProgressTasks() {
            return this.$store.getters.getTasksByStatus('in_progress');
        },

        //* filtrujemy wszystkie elementy ze statusem 'done'
        doneTasks() {
            return this.$store.getters.getTasksByStatus('done');
        },

        //* filtrujemy wszystkie elementy, po przekazanym statusie'
        tbs() {
            return (status) => {
                return this.$store.getters.getTasksByStatus(status);
            };
        },
    },

    methods: {
        getChildPayload(index, col) {
            return this.tbs(col)[index].id;
        },
        //* metoda otrzymuje event onDrop (który posiada informacje o usuniętym oraz dodanym indexie) oraz status której listy dotyczy zdarzenie
        onDrop(dropResult, status) {
            const { removedIndex, addedIndex, payload } = dropResult;

            if (removedIndex === null && addedIndex === null) return;
            console.log(dropResult, status);

            if (removedIndex !== null && addedIndex !== null) {
                //* UŻYTKOWNIK NIE PRZESUNĄŁ ELEMENTU
                if (removedIndex === addedIndex) return;
                //* SPRAWDZAMY CZY UŻYTKOWNIK PRZESUNĄŁ ELEMENT W DÓŁ
                if (removedIndex < addedIndex) {
                    let start = removedIndex + 2;
                    let end = addedIndex + 1;

                    const x = this.$store.getters.getTasksByStatusAndPriority(
                        status,
                        {
                            start,
                            end,
                        }
                    );

                    for (const task of x) {
                        this.$store.commit('setTaskPriority', {
                            id: task.id,
                            priority: task.priority - 1,
                        });
                    }

                    this.$store.commit('setTaskPriority', {
                        id: payload,
                        priority: addedIndex + 1,
                    });
                    //* SPRAWDZAMY CZY UŻYTKOWNIK PRZESUNĄŁ ELEMENT W GÓRĘ
                } else if (removedIndex > addedIndex) {
                    let end = removedIndex;
                    let start = addedIndex + 1;

                    const x = this.$store.getters.getTasksByStatusAndPriority(
                        status,
                        {
                            start,
                            end,
                        }
                    );

                    for (const task of x) {
                        this.$store.commit('setTaskPriority', {
                            id: task.id,
                            priority: task.priority + 1,
                        });
                    }

                    this.$store.commit('setTaskPriority', {
                        id: payload,
                        priority: addedIndex + 1,
                    });
                }
            }

            // let result = this.$store.state.tasks;

            // let itemToAdd = payload;

            // if (removedIndex !== null) {
            //   itemToAdd = result.splice(removedIndex, 1)[0];
            // }

            // if (addedIndex !== null) {
            //   result.splice(addedIndex, 0, itemToAdd);
            // }

            // //do zmiany
            // this.items = result;

            // this.$store.commit('changeTaskPosition', result);
            // // this.$store.commit('setTaskStatus', '23');
            // console.log('onDrop');
        },
    },
};
</script>

<style lang="scss">
.lists__container {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: space-around;
    height: 90vh;
    border: 2px solid black;
}

.list {
    background-color: #f2f2f2;
    display: flex;
    flex-direction: column;
    border: 1px solid coral;
    width: 25%;
    height: 85%;
    gap: 5px;
    padding: 20px;
}

.task {
    max-width: 348px;
    max-height: 91px;
    border-radius: 4px;
    background-color: #ffffff;
    border: 1px solid gray;
    cursor: grab;
    padding: 10px;
}
</style>
