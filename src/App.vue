<template>
    <div id="app">
        <nav>
            <h1>Moje mini trello</h1>
            <button
                @click="
                    test(
                        $store.getters.getTasksByStatusAndPriority(
                            'in_progress',
                            { start: 2, end: 3 }
                        )
                    )
                "
            >
                test()
            </button>
            <p>
                Filtry:
                <button>Wszyscy członkowie</button>
                <button>Wszystkie tagi</button>
            </p>
        </nav>

        <div class="lists__container">
            <div v-for="list in lists" :key="list">
                <h4 class="lists__container__title">{{ list }}</h4>
                <Container
                    class="list"
                    :drag-class="'active'"
                    :group-name="'task-list'"
                    @drop="onDrop($event, list)"
                    :get-child-payload="(ix) => getChildPayload(ix, list)"
                >
                    <Draggable v-for="task in tbs(list)" :key="task.id">
                        <div class="task">
                            {{ task.name }}
                            <p>status: {{ task.status }}</p>
                        </div>
                    </Draggable>
                </Container>
            </div>
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

    data() {
        return {
            lists: ['done', 'in_progress', 'todo'],
        };
    },

    computed: {
        //* FILTRUJEMY WSZYSTKIE TASKI ZE STATUSEM 'TODO'
        todoTasks() {
            return this.$store.getters.getTasksByStatus('todo');
        },

        //* FILTRUJEMY WSZYSTKIE TASKI ZE STATUSEM 'IN_PROGRESS'
        inProgressTasks() {
            return this.$store.getters.getTasksByStatus('in_progress');
        },

        //* FILTRUJEMY WSZYSTKIE TASKI ZE STATUSEM 'DONE'
        doneTasks() {
            return this.$store.getters.getTasksByStatus('done');
        },

        tbs() {
            return (status) => {
                return this.$store.getters.getTasksByStatus(status);
            };
        },
    },

    methods: {
        test(x) {
            return console.log(x);
        },

        getChildPayload(index, col) {
            return this.tbs(col)[index].id;
        },

        //* METODA OTRZYMUJE EVENT ONDROP (KTÓRY POSIADA INFORMACJE O USUNIĘTYM ORAZ DODANYM INDEXIE) ORAZ STATUS, KTÓREJ LISTY DOTYCZY ZDARZENIE
        onDrop(dropResult, status) {
            const { removedIndex, addedIndex, payload } = dropResult;

            // console.log(dropResult, status);

            if (removedIndex === null && addedIndex !== null) {
                console.log(`dodać taska do listy: ${status}`);

                this.$store.commit('setTaskPriority', {
                    taskId: payload,
                    priority: addedIndex,
                });

                this.$store.commit('setTaskStatus', {
                    taskId: payload,
                    newStatus: status,
                });

                return;
            }
            if (addedIndex === null && removedIndex !== null) {
                console.log(`usunąć taska z listy: ${status}`);

                //* WYCINEK TABLICY POD ELEMENTEM, KTÓRY ZOSTAŁ CHWYCONY
                const sliceAfterDnD = this.$store.getters
                    .getTasksByStatusAndPriority(status, {
                        start: removedIndex + 2,
                        end: this.$store.getters.getTasksByStatus(status)
                            .length,
                    })
                    .forEach((task) =>
                        this.$store.commit('setTaskPriority', {
                            taskId: task.id,
                            priority: task.priority - 1,
                        })
                    );
                // console.log({
                //     removedIndex,
                //     length: this.$store.getters.getTasksByStatus.length,
                // });
                console.log(sliceAfterDnD);
                return;
            }

            //* SPRAWDZAMY CZY NA PEWNO OBIEKT Z EVENTU ZOSTAŁ POPRAWNIE PRZEKAZANY
            if (removedIndex === null && addedIndex === null) return;

            if (removedIndex !== null && addedIndex !== null) {
                //* SPRAWDZAMY CZY ELEMENT, KTÓRY CHCEMY PRZESUNĄĆ NIE JEST NA TEJ SAMEJ POZYCJI STARTOWA => NIC NIE RÓB.
                if (removedIndex === addedIndex) return;

                //*
                //* SPRAWDZAMY CZY UŻYTKOWNIK PRZESUNĄŁ ELEMENT W DÓŁ
                //*

                if (removedIndex < addedIndex) {
                    let start = removedIndex + 2;
                    let end = addedIndex + 1;

                    //* WYCINEK TABLICY POMIĘDZY ELEMENTEM CHWYCONYM, A UPUSZCZONYM
                    const sliceBetweenDnD =
                        this.$store.getters.getTasksByStatusAndPriority(
                            status,
                            {
                                start,
                                end,
                            }
                        );

                    //* PĘTLA OBNIŻAJĄCA PRIORYTETY WSZYSTKICH ELEMENTÓW Z WYCINKA
                    for (const task of sliceBetweenDnD) {
                        this.$store.commit('setTaskPriority', {
                            taskId: task.id,
                            priority: task.priority - 1,
                        });
                    }

                    //* WSTAWIENIE CHWYCONEGO ELEMENTU W JEGO NOWE MIEJSCE
                    this.$store.commit('setTaskPriority', {
                        taskId: payload,
                        priority: addedIndex + 1,
                    });

                    //*
                    //* SPRAWDZAMY CZY UŻYTKOWNIK PRZESUNĄŁ ELEMENT W GÓRĘ
                    //*
                } else if (removedIndex > addedIndex) {
                    let end = removedIndex;
                    let start = addedIndex + 1;

                    //* WYCINEK TABLICY POMIĘDZY ELEMENTEM CHWYCONYM, A UPUSZCZONYM
                    const sliceBetweenDnD =
                        this.$store.getters.getTasksByStatusAndPriority(
                            status,
                            {
                                start,
                                end,
                            }
                        );

                    //* PĘTLA PODWYŻSZAJĄCA PRIORYTETY WSZYSTKICH ELEMENTÓW Z WYCINKA
                    for (const task of sliceBetweenDnD) {
                        this.$store.commit('setTaskPriority', {
                            taskId: task.id,
                            priority: task.priority + 1,
                        });
                    }

                    //* WSTAWIENIE CHWYCONEGO ELEMENTU W JEGO NOWE MIEJSCE
                    this.$store.commit('setTaskPriority', {
                        taskId: payload,
                        priority: addedIndex + 1,
                    });
                }
            }
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

.active {
    border: 2px solid red;
}
</style>
