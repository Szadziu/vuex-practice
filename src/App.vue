<template>
    <div class="main">
        <nav class="main__nav">
            <h1 class="main__nav-title">Moje mini trello</h1>
            <p class="filter__options">
                Filtry:
                <select
                    class="filter__options-select"
                    v-model="filters.members"
                >
                    <option value="">Wszyscy członkowie</option>
                    <option
                        v-for="member in $store.getters.getAllMembers"
                        :key="member.id"
                        :value="member.id"
                    >
                        {{ member.name }}
                    </option>
                </select>

                <select class="filter__options-select" v-model="filters.tags">
                    <option value="">Wszystkie tagi</option>
                    <option
                        v-for="tag in $store.getters.getAllTags"
                        :key="tag"
                        :value="tag"
                    >
                        {{ tag }}
                    </option>
                </select>
            </p>
        </nav>

        <div class="lists__container">
            <div class="tasks__list" v-for="list in lists" :key="list">
                <h4 class="tasks__list-title">{{ list | titleFilter }}</h4>
                <Container
                    :drag-class="'active'"
                    :group-name="'tasks-list'"
                    @drop="onDrop($event, list)"
                    :get-child-payload="(ix) => getChildPayload(ix, list)"
                    :drop-placeholder="{ className: 'dropPlaceholder' }"
                >
                    <Draggable v-for="task in tbs(list)" :key="task.id">
                        <div class="task">
                            <div class="task__tags">
                                <div
                                    v-for="tag in task.tags"
                                    :key="tag"
                                    class="task__tags-badge"
                                >
                                    {{ tag }}
                                </div>
                            </div>
                            <div class="task__name">
                                {{ task.name }}
                            </div>
                            <div class="task__members">
                                <img
                                    :src="member.image"
                                    v-for="member in task.members"
                                    :key="member.id"
                                    class="task__members-badge"
                                />
                            </div>
                            <div class="priority">
                                PRIORYTET:
                                {{ task.priority }}
                            </div>
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
            filters: {
                members: '',
                tags: '',
            },
        };
    },

    computed: {
        tbs() {
            return (status) => {
                return this.$store.getters.getTasksByStatus(status, {
                    member: this.filters.members,
                    tag: this.filters.tags,
                });
            };
        },
    },

    filters: {
        titleFilter(title) {
            return title.replace('_', ' ').toUpperCase();
        },
    },

    methods: {
        getChildPayload(index, col) {
            return this.tbs(col)[index].id;
        },

        //* METODA OTRZYMUJE EVENT ONDROP (KTÓRY POSIADA INFORMACJE O USUNIĘTYM ORAZ DODANYM INDEXIE) ORAZ STATUS, KTÓREJ LISTY DOTYCZY ZDARZENIE
        onDrop(dropResult, status) {
            const { removedIndex, addedIndex, payload } = dropResult;

            console.log(dropResult);

            if (removedIndex === null && addedIndex !== null) {
                console.log(`dodać taska do listy: ${status}`);

                this.$store.getters
                    .getTasksByStatusAndPriority(status, {
                        start: addedIndex + 1,
                        end: this.$store.getters.getTasksByStatus(status)
                            .length,
                    })
                    .forEach((task) =>
                        this.$store.commit('setTaskPriority', {
                            taskId: task.id,
                            priority: task.priority + 1,
                        })
                    );

                this.$store.commit('setTaskPriority', {
                    taskId: payload,
                    priority: addedIndex + 1,
                });

                this.$store.commit('setTaskStatus', {
                    taskId: payload,
                    newStatus: status,
                });

                console.log(this.tbs(status));

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
* {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    font-family: 'Montserrat', sans-serif;
}

.main {
    background: center/cover transparent url('./assets/mountains.jpg') no-repeat
        padding-box;
    height: 100vh;
    width: 100vw;

    &__nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 64px;
        width: 100%;
        height: 80px;
        background: #39393933;

        &-title {
            color: #393939;
            font-size: 28px;
        }
    }
}

.filter__options {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 15px;
    font-weight: 700;

    &-select {
        font-weight: 400;
        background-color: #ffffff66;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        appearance: none;
        cursor: pointer;
    }
}

.lists__container {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    margin: 64px 64px 0;
}

.tasks__list {
    width: 380px;
    background-color: #f2f2f2;
    padding: 16px;
    border-radius: 12px;

    &-title {
        margin-bottom: 16px;
    }
}

.task {
    display: flex;
    flex-direction: column;
    gap: 4px;

    border-radius: 4px;
    padding: 8px;
    margin-bottom: 8px;

    background-color: #ffffff;
    color: #393939;

    font-size: 15px;
    cursor: grab;

    &__members {
        display: flex;
        gap: 4px;

        align-self: flex-end;

        &-badge {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 1px solid gray;
        }
    }

    &__tags {
        display: flex;
        gap: 4px;

        &-badge {
            height: 20px;
            background-color: #e6e6e6;
            font-size: 10px;
            font-weight: 700;
            padding: 0 8px;
            border-radius: 8px;
            line-height: 20px;
        }
    }
}

.dropPlaceholder {
    position: relative;
    &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: calc(100% - 8px);
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.1);
    }
}

.priority {
    color: red;
}
</style>
